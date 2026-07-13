const { Op } = require('sequelize');

const Reservacion = require('../../../models/Reservacion');
const Habitacion = require('../../../models/Habitacion');
const EstadoHabitacion = require('../../../models/EstadoHabitacion');
const EstadoReservacion = require('../../../models/EstadoReservacion');
const Tarifa = require('../../../models/Tarifa');
const TipoPago = require('../../../models/TipoPago');
const ReservacionCargo = require('../../../models/ReservacionCargo');
const Orden = require('../../../models/Orden');
const OrdenDetalle = require('../../../models/OrdenDetalle');
const MenuItem = require('../../../models/MenuItem');

const {
  convertirFechaSoloDia,
  sumarDiasAFecha,
  obtenerEstadoReservacionPorCodigo,
  actualizarEstadoHabitacionSegunReservaciones,
  actualizarEstadosHabitacionesSegunReservaciones,
  marcarHabitacionDisponible,
  ESTADOS_HABITACION_MANUALES
} = require('./reservacionService');

function numero(valor) {
  return Number(valor || 0);
}

function redondear2(valor) {
  return Math.round(numero(valor) * 100) / 100;
}


function calcularDiasEntreFechas(fechaEntrada, fechaSalida) {
  const entrada = new Date(fechaEntrada);
  const salida = new Date(fechaSalida);
  entrada.setUTCHours(0, 0, 0, 0);
  salida.setUTCHours(0, 0, 0, 0);

  const diferenciaMs = salida.getTime() - entrada.getTime();
  const dias = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

  return Math.max(dias, 1);
}

function calcularMontoPersonasExtra(adultosExtra, ninosExtra, dias, tarifa) {
  const precioAdulto = Number(tarifa.precio_adulto_extra ?? 100);
  const precioNino = Number(tarifa.precio_nino_extra ?? 50);
  const cantidadDias = Number(dias || 0);

  return {
    montoAdultos: redondear2(Number(adultosExtra || 0) * precioAdulto * cantidadDias),
    montoNinos: redondear2(Number(ninosExtra || 0) * precioNino * cantidadDias),
    total: redondear2((Number(adultosExtra || 0) * precioAdulto * cantidadDias) + (Number(ninosExtra || 0) * precioNino * cantidadDias)),
    precioAdulto,
    precioNino
  };
}

async function calcularTotalesReservacion(reservacionId, totalReservacion, precioPagado) {
  const cargos = await ReservacionCargo.findAll({
    where: {
      reservacion_id: reservacionId,
      estado: {
        [Op.ne]: 'ANULADO'
      }
    }
  });

  const totalCargos = cargos.reduce((total, cargo) => {
    return total + numero(cargo.monto);
  }, 0);

  const totalAPagar = redondear2(numero(totalReservacion) + totalCargos);
  const totalPagado = redondear2(precioPagado);
  const saldo = redondear2(totalAPagar - totalPagado);

  return {
    total_cargos: totalCargos.toFixed(2),
    total_a_pagar: totalAPagar.toFixed(2),
    total_pagado: totalPagado.toFixed(2),
    saldo: saldo.toFixed(2)
  };
}

async function formatearReservacion(reservacion) {
  const data = reservacion.toJSON();

  const habitacion = data.habitacion || null;
  const tarifa = data.tarifa || null;
  const tipoPago = data.tipo_pago || null;
  const estadoReservacion = data.estado_reservacion || null;

  const estadoHabitacion = habitacion && habitacion.estado_habitacion
    ? habitacion.estado_habitacion
    : null;

  const totales = await calcularTotalesReservacion(
    data.id,
    data.total_reservacion,
    data.precio_pagado
  );

  return {
    id: data.id,
    nombre_cliente: data.nombre_cliente,
    nit: data.nit,
    fecha_entrada: data.fecha_entrada,
    fecha_salida: data.fecha_salida,
    dias: data.dias,
    cantidad_personas: data.cantidad_personas,
    cantidad_personas_extra: data.cantidad_personas_extra || 0,
    adultos_extra: data.adultos_extra || 0,
    ninos_extra: data.ninos_extra || 0,
    monto_personas_extra: data.monto_personas_extra || 0,
    monto_adultos_extra: data.monto_adultos_extra || 0,
    monto_ninos_extra: data.monto_ninos_extra || 0,
    motivo_salida_anticipada: data.motivo_salida_anticipada || null,
    total_reservacion: data.total_reservacion,
    total_cargos: totales.total_cargos,
    total_a_pagar: totales.total_a_pagar,
    precio_pagado: data.precio_pagado,
    total_pagado: totales.total_pagado,
    saldo: totales.saldo,

    estado: estadoReservacion
      ? estadoReservacion.nombre
      : null,

    tarifa: tarifa
      ? {
          id: tarifa.id,
          nombre: tarifa.nombre,
          descripcion: tarifa.descripcion,
          precio: tarifa.precio,
          precio_adulto_extra: tarifa.precio_adulto_extra,
          precio_nino_extra: tarifa.precio_nino_extra,
          desayunos_incluidos: tarifa.desayunos_incluidos,
          almuerzos_incluidos: tarifa.almuerzos_incluidos,
          cenas_incluidas: tarifa.cenas_incluidas
        }
      : null,

    tipo_pago: tipoPago
      ? {
          id: tipoPago.id,
          codigo: tipoPago.codigo,
          nombre: tipoPago.nombre,
          descripcion: tipoPago.descripcion
        }
      : null,

    habitacion: habitacion
      ? {
          id: habitacion.id,
          numero: habitacion.numero,
          tipo: habitacion.tipo,
          estado: estadoHabitacion ? estadoHabitacion.nombre : null
        }
      : null,

    fecha_creacion: data.fecha_creacion,
    fecha_actualizacion: data.fecha_actualizacion || null
  };
}

async function obtenerReservacionConDatos(id) {
  return Reservacion.findByPk(id, {
    include: [
      {
        model: EstadoReservacion,
        as: 'estado_reservacion',
        attributes: ['id', 'codigo', 'nombre']
      },
      {
        model: Tarifa,
        as: 'tarifa',
        attributes: ['id', 'nombre', 'descripcion', 'precio', 'precio_adulto_extra', 'precio_nino_extra', 'desayunos_incluidos', 'almuerzos_incluidos', 'cenas_incluidas']
      },
      {
        model: TipoPago,
        as: 'tipo_pago',
        attributes: ['id', 'codigo', 'nombre', 'descripcion']
      },
      {
        model: Habitacion,
        as: 'habitacion',
        attributes: ['id', 'numero', 'tipo', 'estado_id'],
        include: [
          {
            model: EstadoHabitacion,
            as: 'estado_habitacion',
            attributes: ['id', 'codigo', 'nombre']
          }
        ]
      }
    ]
  });
}

async function formatearDetalleFactura(detalle) {
  const data = detalle.toJSON ? detalle.toJSON() : detalle;
  const item = await MenuItem.findByPk(data.menu_item_id);

  return {
    id: data.id,
    menu_item_id: data.menu_item_id,
    nombre: item ? item.nombre : 'Producto de menú',
    descripcion: item ? item.descripcion : null,
    cantidad: data.cantidad,
    precio_unitario: data.precio_unitario,
    subtotal: data.subtotal,
    observaciones: data.observaciones,
    estado_cocina: data.estado_cocina,
    exclusiones: (() => {
      try {
        return data.exclusiones_json ? JSON.parse(data.exclusiones_json) : [];
      } catch (error) {
        return [];
      }
    })()
  };
}

async function formatearOrdenFactura(ordenId) {
  if (!ordenId) return null;

  const orden = await Orden.findByPk(ordenId);

  if (!orden) return null;

  const detalles = await OrdenDetalle.findAll({
    where: {
      orden_id: orden.id
    },
    order: [['id', 'ASC']]
  });

  return {
    id: orden.id,
    tipo_orden: orden.tipo_orden,
    numero_mesa: orden.numero_mesa,
    habitacion_id: orden.habitacion_id,
    subtotal: orden.subtotal,
    total: orden.total,
    estado: orden.estado,
    observaciones: orden.observaciones,
    fecha_creacion: orden.fecha_creacion,
    detalles: await Promise.all(detalles.map(formatearDetalleFactura))
  };
}

async function construirFacturaReservacion(id) {
  const reservacionConDatos = await obtenerReservacionConDatos(id);

  if (!reservacionConDatos) {
    return null;
  }

  const reservacionFormateada = await formatearReservacion(reservacionConDatos);

  const cargos = await ReservacionCargo.findAll({
    where: {
      reservacion_id: id,
      estado: {
        [Op.ne]: 'ANULADO'
      }
    },
    order: [['fecha_cargo', 'ASC'], ['id', 'ASC']]
  });

  const cargosFormateados = await Promise.all(cargos.map(async (cargo) => {
    return {
      id: cargo.id,
      reservacion_id: cargo.reservacion_id,
      orden_id: cargo.orden_id,
      tipo_cargo: cargo.tipo_cargo,
      descripcion: cargo.descripcion,
      monto: cargo.monto,
      estado: cargo.estado,
      fecha_cargo: cargo.fecha_cargo,
      fecha_creacion: cargo.fecha_creacion,
      orden: await formatearOrdenFactura(cargo.orden_id)
    };
  }));

  const totalReservacion = numero(reservacionConDatos.total_reservacion);
  const totalCargos = cargosFormateados.reduce((total, cargo) => {
    return total + numero(cargo.monto);
  }, 0);
  const totalAPagar = redondear2(totalReservacion + totalCargos);
  const totalPagado = redondear2(reservacionConDatos.precio_pagado);
  const saldo = redondear2(totalAPagar - totalPagado);

  return {
    reservacion: reservacionFormateada,
    factura: {
      numero: `FAC-RES-${reservacionConDatos.id}`,
      estado: reservacionFormateada.estado,
      cliente: {
        nombre: reservacionConDatos.nombre_cliente,
        nit: reservacionConDatos.nit
      },
      habitacion: reservacionFormateada.habitacion,
      tarifa: reservacionFormateada.tarifa,
      reserva: {
        descripcion: `Reservación habitación ${reservacionFormateada.habitacion ? reservacionFormateada.habitacion.numero : ''} - ${reservacionConDatos.dias} día(s)`,
        fecha_entrada: reservacionConDatos.fecha_entrada,
        fecha_salida: reservacionConDatos.fecha_salida,
        dias: reservacionConDatos.dias,
        cantidad_personas_extra: reservacionConDatos.cantidad_personas_extra || 0,
        adultos_extra: reservacionConDatos.adultos_extra || 0,
        ninos_extra: reservacionConDatos.ninos_extra || 0,
        tarifa_adulto_extra: reservacionFormateada.tarifa ? reservacionFormateada.tarifa.precio_adulto_extra : 100,
        tarifa_nino_extra: reservacionFormateada.tarifa ? reservacionFormateada.tarifa.precio_nino_extra : 50,
        monto_personas_extra: reservacionConDatos.monto_personas_extra || 0,
        monto_adultos_extra: reservacionConDatos.monto_adultos_extra || 0,
        monto_ninos_extra: reservacionConDatos.monto_ninos_extra || 0,
        motivo_salida_anticipada: reservacionConDatos.motivo_salida_anticipada || null,
        monto: totalReservacion.toFixed(2)
      },
      cargos: cargosFormateados,
      subtotal_reservacion: totalReservacion.toFixed(2),
      total_cargos: totalCargos.toFixed(2),
      total_a_pagar: totalAPagar.toFixed(2),
      total_pagado: totalPagado.toFixed(2),
      saldo: saldo.toFixed(2),
      tipo_pago: reservacionFormateada.tipo_pago,
      fecha_creacion: reservacionConDatos.fecha_creacion
    }
  };
}

async function crearReservacion(req, res) {
  try {
    const {
      habitacion_id,
      tarifa_id,
      nombre_cliente,
      nit,
      fecha_entrada,
      dias,
      cantidad_personas,
      cantidad_personas_extra,
      adultos_extra,
      ninos_extra
    } = req.body;

    if (!habitacion_id || !tarifa_id || !nombre_cliente || !fecha_entrada || !dias) {
      return res.status(400).json({
        mensaje: 'habitacion_id, tarifa_id, nombre_cliente, fecha_entrada y dias son obligatorios'
      });
    }

    if (Number(dias) <= 0) {
      return res.status(400).json({
        mensaje: 'dias debe ser mayor a 0'
      });
    }

    const fechaEntrada = convertirFechaSoloDia(fecha_entrada);

    if (!fechaEntrada) {
      return res.status(400).json({
        mensaje: 'La fecha de entrada no es válida. Use formato YYYY-MM-DD'
      });
    }

    const fechaSalida = sumarDiasAFecha(fechaEntrada, dias);

    const habitacion = await Habitacion.findByPk(habitacion_id, {
      include: [
        {
          model: EstadoHabitacion,
          as: 'estado_habitacion',
          attributes: ['id', 'codigo', 'nombre']
        }
      ]
    });

    if (!habitacion) {
      return res.status(404).json({
        mensaje: 'Habitación no encontrada'
      });
    }

    const tarifa = await Tarifa.findByPk(tarifa_id);

    if (!tarifa) {
      return res.status(404).json({
        mensaje: 'Tarifa no encontrada'
      });
    }

    const codigoEstadoHabitacion = habitacion.estado_habitacion
      ? habitacion.estado_habitacion.codigo
      : null;

    if (ESTADOS_HABITACION_MANUALES.includes(codigoEstadoHabitacion)) {
      return res.status(409).json({
        mensaje: `No se puede reservar una habitación en estado ${codigoEstadoHabitacion}`
      });
    }

    const estadoConfirmada = await obtenerEstadoReservacionPorCodigo('CONFIRMADA');

    const reservacionTraslapada = await Reservacion.findOne({
      where: {
        habitacion_id,
        estado_reservacion_id: estadoConfirmada.id,
        fecha_entrada: {
          [Op.lte]: fechaSalida
        },
        fecha_salida: {
          [Op.gte]: fechaEntrada
        }
      }
    });

    if (reservacionTraslapada) {
      return res.status(409).json({
        mensaje: 'La habitación ya tiene una reservación confirmada en ese rango de fechas'
      });
    }

    const adultosExtra = Math.max(Number(adultos_extra ?? cantidad_personas_extra ?? cantidad_personas ?? 0), 0);
    const ninosExtra = Math.max(Number(ninos_extra ?? 0), 0);
    const personasExtra = adultosExtra + ninosExtra;
    const montosExtra = calcularMontoPersonasExtra(adultosExtra, ninosExtra, Number(dias), tarifa);
    const montoPersonasExtra = montosExtra.total;
    const totalReservacion = redondear2((Number(tarifa.precio || 0) * Number(dias)) + montoPersonasExtra);

    const reservacion = await Reservacion.create({
      habitacion_id,
      tarifa_id,
      estado_reservacion_id: estadoConfirmada.id,
      tipo_pago_id: null,
      nombre_cliente,
      nit: nit || null,
      fecha_entrada: fechaEntrada,
      fecha_salida: fechaSalida,
      dias: Number(dias),
      cantidad_personas: Number(habitacion.capacidad_personas || 0) + personasExtra,
      cantidad_personas_extra: personasExtra,
      adultos_extra: adultosExtra,
      ninos_extra: ninosExtra,
      monto_personas_extra: montoPersonasExtra,
      monto_adultos_extra: montosExtra.montoAdultos,
      monto_ninos_extra: montosExtra.montoNinos,
      motivo_salida_anticipada: null,
      fecha_actualizacion: null,
      total_reservacion: totalReservacion,
      precio_pagado: 0,
      fecha_creacion: new Date()
    });

    await actualizarEstadoHabitacionSegunReservaciones(habitacion_id, {
      respetarEstadosManuales: false
    });

    const reservacionConDatos = await obtenerReservacionConDatos(reservacion.id);

    return res.status(201).json({
      mensaje: 'Reservación creada correctamente',
      reservacion: await formatearReservacion(reservacionConDatos)
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al crear reservación'
    });
  }
}

async function listarReservaciones(req, res) {
  try {
    await actualizarEstadosHabitacionesSegunReservaciones();

    const {
      habitacion_id,
      estado_reservacion_id
    } = req.query;

    const where = {};

    if (habitacion_id) {
      where.habitacion_id = habitacion_id;
    }

    if (estado_reservacion_id) {
      where.estado_reservacion_id = estado_reservacion_id;
    }

    const reservaciones = await Reservacion.findAll({
      where,
      include: [
        {
          model: EstadoReservacion,
          as: 'estado_reservacion',
          attributes: ['id', 'codigo', 'nombre']
        },
        {
          model: Tarifa,
          as: 'tarifa',
          attributes: ['id', 'nombre', 'descripcion', 'precio', 'precio_adulto_extra', 'precio_nino_extra', 'desayunos_incluidos', 'almuerzos_incluidos', 'cenas_incluidas']
        },
        {
          model: TipoPago,
          as: 'tipo_pago',
          attributes: ['id', 'codigo', 'nombre', 'descripcion']
        },
        {
          model: Habitacion,
          as: 'habitacion',
          attributes: ['id', 'numero', 'tipo', 'estado_id'],
          include: [
            {
              model: EstadoHabitacion,
              as: 'estado_habitacion',
              attributes: ['id', 'codigo', 'nombre']
            }
          ]
        }
      ],
      order: [['fecha_entrada', 'DESC'], ['id', 'DESC']]
    });

    return res.json({
      mensaje: 'Reservaciones obtenidas correctamente',
      reservaciones: await Promise.all(reservaciones.map(formatearReservacion))
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al listar reservaciones'
    });
  }
}

async function obtenerFacturaReservacion(req, res) {
  try {
    const { id } = req.params;

    const factura = await construirFacturaReservacion(id);

    if (!factura) {
      return res.status(404).json({
        mensaje: 'Reservación no encontrada'
      });
    }

    return res.json({
      mensaje: 'Factura de reservación obtenida correctamente',
      ...factura
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al obtener factura de reservación'
    });
  }
}

async function pagarReservacion(req, res) {
  try {
    const { id } = req.params;

    const {
      precio_pagado,
      tipo_pago_id
    } = req.body;

    if (!tipo_pago_id) {
      return res.status(400).json({
        mensaje: 'tipo_pago_id es obligatorio'
      });
    }

    const reservacion = await Reservacion.findByPk(id);

    if (!reservacion) {
      return res.status(404).json({
        mensaje: 'Reservación no encontrada'
      });
    }

    const tipoPago = await TipoPago.findOne({
      where: {
        id: tipo_pago_id,
        estado: true
      }
    });

    if (!tipoPago) {
      return res.status(404).json({
        mensaje: 'Tipo de pago no encontrado o inactivo'
      });
    }

    const factura = await construirFacturaReservacion(id);
    const totalAPagar = factura ? numero(factura.factura.total_a_pagar) : numero(reservacion.total_reservacion);
    const montoPagado = precio_pagado === undefined || precio_pagado === null || precio_pagado === ''
      ? totalAPagar
      : numero(precio_pagado);

    if (montoPagado <= 0) {
      return res.status(400).json({
        mensaje: 'El total a pagar debe ser mayor a 0'
      });
    }

    const estadoPagada = await obtenerEstadoReservacionPorCodigo('PAGADA');

    reservacion.precio_pagado = montoPagado;
    reservacion.tipo_pago_id = tipoPago.id;
    reservacion.estado_reservacion_id = estadoPagada.id;
    reservacion.fecha_actualizacion = new Date();

    await reservacion.save();

    await ReservacionCargo.update(
      {
        estado: 'PAGADO'
      },
      {
        where: {
          reservacion_id: id,
          estado: 'PENDIENTE'
        }
      }
    );

    await marcarHabitacionDisponible(reservacion.habitacion_id);

    const reservacionActualizada = await obtenerReservacionConDatos(id);
    const facturaActualizada = await construirFacturaReservacion(id);

    return res.json({
      mensaje: 'Reservación pagada correctamente',
      reservacion: await formatearReservacion(reservacionActualizada),
      factura: facturaActualizada ? facturaActualizada.factura : null
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al pagar reservación'
    });
  }
}


async function registrarSalidaAnticipada(req, res) {
  try {
    const { id } = req.params;
    const { fecha_salida, motivo } = req.body;

    if (!fecha_salida || !motivo) {
      return res.status(400).json({
        mensaje: 'fecha_salida y motivo son obligatorios'
      });
    }

    const reservacion = await Reservacion.findByPk(id);

    if (!reservacion) {
      return res.status(404).json({
        mensaje: 'Reservación no encontrada'
      });
    }

    const estadoPagada = await obtenerEstadoReservacionPorCodigo('PAGADA');

    if (Number(reservacion.estado_reservacion_id) === Number(estadoPagada.id)) {
      return res.status(400).json({
        mensaje: 'No se puede registrar salida anticipada en una reservación pagada'
      });
    }

    const fechaSalidaNueva = convertirFechaSoloDia(fecha_salida);

    if (!fechaSalidaNueva) {
      return res.status(400).json({
        mensaje: 'La fecha de salida no es válida. Use formato YYYY-MM-DD'
      });
    }

    const fechaEntrada = convertirFechaSoloDia(reservacion.fecha_entrada);

    if (fechaSalidaNueva.getTime() <= fechaEntrada.getTime()) {
      return res.status(400).json({
        mensaje: 'La fecha de salida debe ser posterior a la fecha de entrada'
      });
    }

    if (fechaSalidaNueva.getTime() > new Date(reservacion.fecha_salida).getTime()) {
      return res.status(400).json({
        mensaje: 'La nueva fecha de salida no puede ser mayor a la fecha actual de salida'
      });
    }

    const tarifa = await Tarifa.findByPk(reservacion.tarifa_id);

    if (!tarifa) {
      return res.status(404).json({
        mensaje: 'Tarifa no encontrada'
      });
    }

    const diasRecalculados = calcularDiasEntreFechas(fechaEntrada, fechaSalidaNueva);
    const adultosExtra = Number(reservacion.adultos_extra ?? reservacion.cantidad_personas_extra ?? 0);
    const ninosExtra = Number(reservacion.ninos_extra || 0);
    const montosExtra = calcularMontoPersonasExtra(adultosExtra, ninosExtra, diasRecalculados, tarifa);
    const montoPersonasExtra = montosExtra.total;
    const totalReservacion = redondear2((Number(tarifa.precio || 0) * diasRecalculados) + montoPersonasExtra);

    reservacion.fecha_salida = fechaSalidaNueva;
    reservacion.dias = diasRecalculados;
    reservacion.monto_personas_extra = montoPersonasExtra;
    reservacion.monto_adultos_extra = montosExtra.montoAdultos;
    reservacion.monto_ninos_extra = montosExtra.montoNinos;
    reservacion.total_reservacion = totalReservacion;
    reservacion.motivo_salida_anticipada = motivo;
    reservacion.fecha_actualizacion = new Date();

    await reservacion.save();

    await actualizarEstadoHabitacionSegunReservaciones(reservacion.habitacion_id, {
      respetarEstadosManuales: false
    });

    const reservacionActualizada = await obtenerReservacionConDatos(id);
    const facturaActualizada = await construirFacturaReservacion(id);

    return res.json({
      mensaje: 'Salida anticipada registrada correctamente',
      reservacion: await formatearReservacion(reservacionActualizada),
      factura: facturaActualizada ? facturaActualizada.factura : null
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al registrar salida anticipada'
    });
  }
}

module.exports = {
  crearReservacion,
  listarReservaciones,
  obtenerFacturaReservacion,
  pagarReservacion,
  registrarSalidaAnticipada,
  construirFacturaReservacion,
  formatearReservacion
};
