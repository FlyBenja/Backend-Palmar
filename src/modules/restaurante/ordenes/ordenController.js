const { Op } = require('sequelize');

const Orden = require('../../../models/Orden');
const OrdenDetalle = require('../../../models/OrdenDetalle');
const MenuItem = require('../../../models/MenuItem');
const MenuItemIngrediente = require('../../../models/MenuItemIngrediente');
const ProductoInventario = require('../../../models/ProductoInventario');
const InventarioMovimiento = require('../../../models/InventarioMovimiento');
const Habitacion = require('../../../models/Habitacion');
const Reservacion = require('../../../models/Reservacion');
const ReservacionCargo = require('../../../models/ReservacionCargo');
const Pago = require('../../../models/Pago');
const TipoPago = require('../../../models/TipoPago');
const Evento = require('../../../models/Evento');
const Credito = require('../../../models/Credito');
const CreditoCargo = require('../../../models/CreditoCargo');

function obtenerUsuarioId(req) {
  return req.usuario ? Number(req.usuario.id || req.usuario.usuario_id || 0) || null : null;
}


function parsearExclusiones(valor) {
  if (!valor) return [];
  if (Array.isArray(valor)) return valor.map(Number).filter(Boolean);

  try {
    const data = JSON.parse(valor);
    return Array.isArray(data) ? data.map(Number).filter(Boolean) : [];
  } catch (error) {
    return [];
  }
}

async function construirExclusiones(productoIds) {
  const exclusiones = [];

  for (const productoId of productoIds) {
    const producto = await ProductoInventario.findByPk(productoId);

    if (producto) {
      exclusiones.push({
        producto_inventario_id: producto.id,
        nombre: producto.nombre,
        unidad_medida: producto.unidad_medida
      });
    }
  }

  return exclusiones;
}

function leerExclusionesGuardadas(exclusionesJson) {
  if (!exclusionesJson) return [];

  try {
    const data = JSON.parse(exclusionesJson);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

async function devolverInventarioDeOrden(orden, usuarioId, motivo) {
  const movimientosSalida = await InventarioMovimiento.findAll({
    where: {
      tipo_movimiento: 'SALIDA',
      referencia_tipo: 'ORDEN',
      referencia_id: orden.id
    },
    order: [['id', 'ASC']]
  });

  for (const movimiento of movimientosSalida) {
    const yaRevertido = await InventarioMovimiento.findOne({
      where: {
        tipo_movimiento: 'ENTRADA',
        referencia_tipo: 'REVERSA_ORDEN',
        referencia_id: movimiento.id
      }
    });

    if (yaRevertido) {
      continue;
    }

    const producto = await ProductoInventario.findByPk(movimiento.producto_inventario_id);

    if (!producto) {
      continue;
    }

    const stockAnterior = Number(producto.stock_actual || 0);
    const cantidad = Number(movimiento.cantidad || 0);
    const stockNuevo = stockAnterior + cantidad;

    producto.stock_actual = stockNuevo;
    producto.fecha_actualizacion = new Date();
    await producto.save();

    await InventarioMovimiento.create({
      producto_inventario_id: producto.id,
      tipo_movimiento: 'ENTRADA',
      cantidad,
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      costo_unitario: movimiento.costo_unitario || producto.costo_unitario || 0,
      referencia_tipo: 'REVERSA_ORDEN',
      referencia_id: movimiento.id,
      observacion: `Reversa de orden #${orden.id}. ${motivo || ''}`.trim(),
      usuario_id: usuarioId,
      fecha_movimiento: new Date()
    });
  }
}

function numero(valor) {
  return Number(valor || 0);
}

function redondear2(valor) {
  return Math.round(numero(valor) * 100) / 100;
}

function rangoDia(fechaTexto) {
  const fecha = fechaTexto ? new Date(`${fechaTexto}T00:00:00`) : new Date();

  if (Number.isNaN(fecha.getTime())) {
    return null;
  }

  const inicio = new Date(fecha);
  inicio.setHours(0, 0, 0, 0);

  const fin = new Date(fecha);
  fin.setHours(23, 59, 59, 999);

  return { inicio, fin };
}

async function formatearDetalle(detalle) {
  const data = detalle.toJSON ? detalle.toJSON() : detalle;
  const item = await MenuItem.findByPk(data.menu_item_id);
  const exclusiones = leerExclusionesGuardadas(data.exclusiones_json);
  const exclusionesSet = new Set(exclusiones.map((producto) => Number(producto.producto_inventario_id)));

  const ingredientesBase = await MenuItemIngrediente.findAll({
    where: {
      menu_item_id: data.menu_item_id
    },
    order: [['id', 'ASC']]
  });

  const ingredientes = [];

  for (const ingrediente of ingredientesBase) {
    const producto = await ProductoInventario.findByPk(ingrediente.producto_inventario_id);
    const cantidadPorUnidad = Number(ingrediente.cantidad_requerida || 0);
    const cantidadDetalle = Number(data.cantidad || 0);

    ingredientes.push({
      id: ingrediente.id,
      menu_item_id: ingrediente.menu_item_id,
      producto_inventario_id: ingrediente.producto_inventario_id,
      cantidad_requerida: ingrediente.cantidad_requerida,
      cantidad_total: cantidadPorUnidad * cantidadDetalle,
      excluido: exclusionesSet.has(Number(ingrediente.producto_inventario_id)),
      producto: producto
        ? {
            id: producto.id,
            nombre: producto.nombre,
            unidad_medida: producto.unidad_medida
          }
        : null
    });
  }

  return {
    id: data.id,
    orden_id: data.orden_id,
    menu_item_id: data.menu_item_id,
    menu_item: item
      ? {
          id: item.id,
          nombre: item.nombre,
          descripcion: item.descripcion,
          precio: item.precio,
          tipo: item.tipo,
          disponible: item.disponible,
          imagen_url: item.imagen_url
        }
      : null,
    cantidad: data.cantidad,
    precio_unitario: data.precio_unitario,
    subtotal: data.subtotal,
    observaciones: data.observaciones,
    exclusiones,
    ingredientes,
    estado_cocina: data.estado_cocina,
    fecha_creacion: data.fecha_creacion,
    fecha_actualizacion: data.fecha_actualizacion
  };
}

async function formatearOrden(orden) {
  const data = orden.toJSON ? orden.toJSON() : orden;
  const detalles = await OrdenDetalle.findAll({
    where: {
      orden_id: data.id
    },
    order: [['id', 'ASC']]
  });

  const habitacion = data.habitacion_id ? await Habitacion.findByPk(data.habitacion_id) : null;
  const reservacion = data.reservacion_id ? await Reservacion.findByPk(data.reservacion_id) : null;
  const evento = data.evento_id ? await Evento.findByPk(data.evento_id) : null;
  const credito = data.credito_id ? await Credito.findByPk(data.credito_id) : null;

  return {
    id: data.id,
    usuario_id: data.usuario_id,
    reservacion_id: data.reservacion_id,
    reservacion: reservacion
      ? {
          id: reservacion.id,
          nombre_cliente: reservacion.nombre_cliente,
          nit: reservacion.nit
        }
      : null,
    tipo_orden: data.tipo_orden,
    numero_mesa: data.numero_mesa,
    habitacion_id: data.habitacion_id,
    evento_id: data.evento_id || null,
    evento: evento ? { id: evento.id, cliente_nombre: evento.cliente_nombre, estado: evento.estado } : null,
    credito_id: data.credito_id || null,
    credito: credito ? { id: credito.id, cliente_nombre: credito.cliente_nombre, empresa: credito.empresa, estado: credito.estado } : null,
    habitacion: habitacion
      ? {
          id: habitacion.id,
          numero: habitacion.numero,
          tipo: habitacion.tipo
        }
      : null,
    subtotal: data.subtotal,
    total: data.total,
    estado: data.estado,
    observaciones: data.observaciones,
    fecha_creacion: data.fecha_creacion,
    fecha_actualizacion: data.fecha_actualizacion,
    detalles: await Promise.all(detalles.map(formatearDetalle))
  };
}

async function crearOrden(req, res) {
  try {
    const {
      tipo_orden,
      numero_mesa,
      habitacion_id,
      reservacion_id,
      evento_id,
      credito_id,
      observaciones,
      directo_recibo,
      detalles
    } = req.body;

    if (!Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({
        mensaje: 'Debe enviar al menos un detalle de orden'
      });
    }

    const tipoOrdenFinal = tipo_orden || 'MESA';

    if (!['MESA', 'LLEVAR', 'HABITACION', 'EMPLEADO', 'EVENTO', 'CREDITO'].includes(tipoOrdenFinal)) {
      return res.status(400).json({
        mensaje: 'tipo_orden debe ser MESA, LLEVAR, HABITACION, EMPLEADO, EVENTO o CREDITO'
      });
    }

    const agregarDirectoARecibo = Boolean(directo_recibo);

    if (tipoOrdenFinal === 'MESA' && !String(numero_mesa || '').trim()) {
      return res.status(400).json({
        mensaje: 'Para una orden de mesa debe enviar número de mesa'
      });
    }

    if (agregarDirectoARecibo && tipoOrdenFinal !== 'MESA') {
      return res.status(400).json({
        mensaje: 'Solo puede agregar bebidas directo a un recibo pendiente de mesa'
      });
    }

    if (agregarDirectoARecibo) {
      const ordenesPendientesMesa = await obtenerOrdenesDirectasPendientes(`MESA-${String(numero_mesa || '').trim()}`);

      if (ordenesPendientesMesa.length === 0) {
        return res.status(400).json({
          mensaje: 'La mesa no tiene un recibo pendiente para agregar bebidas directo'
        });
      }
    }

    if (tipoOrdenFinal === 'HABITACION') {
      if (!habitacion_id || !reservacion_id) {
        return res.status(400).json({
          mensaje: 'Para una orden de habitación debe enviar habitacion_id y reservacion_id'
        });
      }

      const reservacionHabitacion = await Reservacion.findOne({
        where: {
          id: reservacion_id,
          habitacion_id
        }
      });

      if (!reservacionHabitacion) {
        return res.status(404).json({
          mensaje: 'No se encontró una reservación válida para la habitación seleccionada'
        });
      }
    }

    if (tipoOrdenFinal === 'EVENTO') {
      if (!evento_id) {
        return res.status(400).json({ mensaje: 'Para una orden de evento debe enviar evento_id' });
      }

      const evento = await Evento.findOne({ where: { id: evento_id, estado: 'ABIERTO' } });
      if (!evento) {
        return res.status(404).json({ mensaje: 'No se encontró un evento abierto válido' });
      }
    }

    if (tipoOrdenFinal === 'CREDITO') {
      if (!credito_id) {
        return res.status(400).json({ mensaje: 'Para una orden a crédito debe enviar credito_id' });
      }

      const credito = await Credito.findOne({ where: { id: credito_id, estado: 'PENDIENTE' } });
      if (!credito) {
        return res.status(404).json({ mensaje: 'No se encontró una cuenta de crédito pendiente válida' });
      }
    }

    let subtotalOrden = 0;
    const detallesPreparados = [];
    const consumoInventarioPorProducto = new Map();

    for (const detalle of detalles) {
      if (!detalle.menu_item_id || !detalle.cantidad) {
        return res.status(400).json({
          mensaje: 'Cada detalle debe tener menu_item_id y cantidad'
        });
      }

      const item = await MenuItem.findOne({
        where: {
          id: detalle.menu_item_id,
          estado: true,
          disponible: true
        }
      });

      if (!item) {
        return res.status(404).json({
          mensaje: `El item de menú ${detalle.menu_item_id} no existe o no está disponible`
        });
      }

      const cantidad = Number(detalle.cantidad);

      if (cantidad <= 0) {
        return res.status(400).json({
          mensaje: 'cantidad debe ser mayor a 0'
        });
      }

      if (agregarDirectoARecibo && String(item.tipo || '').toUpperCase() !== 'BEBIDA') {
        return res.status(400).json({
          mensaje: 'Solo las bebidas pueden agregarse directamente a un recibo pendiente'
        });
      }

      const exclusionesIds = parsearExclusiones(detalle.exclusiones_productos || detalle.productos_excluidos);
      const exclusiones = await construirExclusiones(exclusionesIds);
      const exclusionesIdsSet = new Set(exclusiones.map((producto) => Number(producto.producto_inventario_id)));

      const precioUnitario = Number(item.precio || 0);
      const subtotal = precioUnitario * cantidad;

      subtotalOrden += subtotal;

      detallesPreparados.push({
        menu_item_id: item.id,
        cantidad,
        precio_unitario: precioUnitario,
        subtotal,
        observaciones: detalle.observaciones || null,
        exclusiones
      });

      const ingredientes = await MenuItemIngrediente.findAll({
        where: {
          menu_item_id: item.id
        }
      });

      for (const ingrediente of ingredientes) {
        const productoId = Number(ingrediente.producto_inventario_id);
        const cantidadRequerida = Number(ingrediente.cantidad_requerida || 0) * cantidad;

        if (exclusionesIdsSet.has(productoId)) {
          continue;
        }

        if (!productoId || cantidadRequerida <= 0) {
          continue;
        }

        const acumuladoActual = consumoInventarioPorProducto.get(productoId) || 0;
        consumoInventarioPorProducto.set(productoId, acumuladoActual + cantidadRequerida);
      }
    }

    const productosInventarioParaConsumir = [];

    for (const [productoId, cantidadNecesaria] of consumoInventarioPorProducto.entries()) {
      const producto = await ProductoInventario.findOne({
        where: {
          id: productoId,
          estado: true
        }
      });

      if (!producto) {
        return res.status(404).json({
          mensaje: `Producto de inventario ${productoId} no encontrado o inactivo`
        });
      }

      const stockActual = Number(producto.stock_actual || 0);

      if (stockActual < cantidadNecesaria) {
        return res.status(400).json({
          mensaje: `Stock insuficiente para ${producto.nombre}. Disponible: ${stockActual} ${producto.unidad_medida}, requerido: ${cantidadNecesaria} ${producto.unidad_medida}`
        });
      }

      productosInventarioParaConsumir.push({
        producto,
        cantidadNecesaria,
        stockActual
      });
    }

    const totalOrden = tipoOrdenFinal === 'EMPLEADO' ? 0 : subtotalOrden;

    const orden = await Orden.create({
      usuario_id: obtenerUsuarioId(req),
      reservacion_id: tipoOrdenFinal === 'HABITACION' ? (reservacion_id || null) : null,
      tipo_orden: tipoOrdenFinal,
      numero_mesa: tipoOrdenFinal === 'MESA' ? (numero_mesa || null) : null,
      habitacion_id: tipoOrdenFinal === 'HABITACION' ? (habitacion_id || null) : null,
      evento_id: tipoOrdenFinal === 'EVENTO' ? (evento_id || null) : null,
      credito_id: tipoOrdenFinal === 'CREDITO' ? (credito_id || null) : null,
      subtotal: subtotalOrden,
      total: totalOrden,
      estado: agregarDirectoARecibo ? 'ENTREGADA' : 'EN_COCINA',
      observaciones: observaciones || null,
      fecha_creacion: new Date(),
      fecha_actualizacion: agregarDirectoARecibo ? new Date() : null
    });

    for (const detalle of detallesPreparados) {
      await OrdenDetalle.create({
        orden_id: orden.id,
        menu_item_id: detalle.menu_item_id,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        subtotal: detalle.subtotal,
        observaciones: detalle.observaciones,
        exclusiones_json: JSON.stringify(detalle.exclusiones || []),
        estado_cocina: agregarDirectoARecibo ? 'ENTREGADO' : 'PENDIENTE',
        fecha_creacion: new Date(),
        fecha_actualizacion: agregarDirectoARecibo ? new Date() : null
      });
    }

    for (const consumo of productosInventarioParaConsumir) {
      const stockNuevo = consumo.stockActual - consumo.cantidadNecesaria;

      consumo.producto.stock_actual = stockNuevo;
      consumo.producto.fecha_actualizacion = new Date();
      await consumo.producto.save();

      await InventarioMovimiento.create({
        producto_inventario_id: consumo.producto.id,
        tipo_movimiento: 'SALIDA',
        cantidad: consumo.cantidadNecesaria,
        stock_anterior: consumo.stockActual,
        stock_nuevo: stockNuevo,
        costo_unitario: consumo.producto.costo_unitario || 0,
        referencia_tipo: 'ORDEN',
        referencia_id: orden.id,
        observacion: `Consumo automático por orden #${orden.id}`,
        usuario_id: obtenerUsuarioId(req),
        fecha_movimiento: new Date()
      });
    }

    if (tipoOrdenFinal === 'HABITACION' && reservacion_id) {
      await ReservacionCargo.create({
        reservacion_id,
        orden_id: orden.id,
        tipo_cargo: 'ORDEN',
        descripcion: `Orden de restaurante #${orden.id}`,
        monto: subtotalOrden,
        estado: 'PENDIENTE',
        fecha_cargo: new Date(),
        fecha_creacion: new Date()
      });
    }



    if (tipoOrdenFinal === 'EVENTO' && evento_id) {
      const evento = await Evento.findByPk(evento_id);
      if (evento) {
        evento.total = redondear2(numero(evento.total) + subtotalOrden);
        evento.fecha_actualizacion = new Date();
        await evento.save();
      }
    }

    if (tipoOrdenFinal === 'CREDITO' && credito_id) {
      await CreditoCargo.create({
        credito_id,
        orden_id: orden.id,
        tipo_cargo: 'RESTAURANTE',
        descripcion: `Orden de restaurante #${orden.id}`,
        monto: subtotalOrden,
        estado: 'PENDIENTE',
        fecha_cargo: new Date(),
        fecha_creacion: new Date()
      });

      const credito = await Credito.findByPk(credito_id);
      if (credito) {
        credito.total = redondear2(numero(credito.total) + subtotalOrden);
        credito.fecha_actualizacion = new Date();
        await credito.save();
      }
    }

    return res.status(201).json({
      mensaje: 'Orden creada correctamente',
      orden: await formatearOrden(orden)
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al crear orden'
    });
  }
}

async function listarOrdenes(req, res) {
  try {
    const {
      fecha,
      estado,
      solo_hoy
    } = req.query;

    const where = {};

    if (estado) where.estado = estado;

    if (fecha || solo_hoy === 'true') {
      const rango = rangoDia(fecha);

      if (!rango) {
        return res.status(400).json({
          mensaje: 'fecha inválida. Use YYYY-MM-DD'
        });
      }

      where.fecha_creacion = {
        [Op.between]: [rango.inicio, rango.fin]
      };
    }

    const ordenes = await Orden.findAll({
      where,
      order: [['fecha_creacion', 'DESC'], ['id', 'DESC']]
    });

    return res.json({
      mensaje: 'Órdenes obtenidas correctamente',
      ordenes: await Promise.all(ordenes.map(formatearOrden))
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al listar órdenes'
    });
  }
}

async function listarOrdenesCocinaHoy(req, res) {
  try {
    const rango = rangoDia();

    const ordenes = await Orden.findAll({
      where: {
        fecha_creacion: {
          [Op.between]: [rango.inicio, rango.fin]
        },
        estado: {
          [Op.in]: ['PENDIENTE', 'EN_COCINA', 'LISTA']
        }
      },
      order: [['fecha_creacion', 'ASC'], ['id', 'ASC']]
    });

    return res.json({
      mensaje: 'Órdenes de cocina obtenidas correctamente',
      ordenes: await Promise.all(ordenes.map(formatearOrden))
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al listar órdenes de cocina'
    });
  }
}


async function asegurarPagoEmpleadoSiCorresponde(orden) {
  if (!orden || orden.tipo_orden !== 'EMPLEADO' || orden.estado !== 'ENTREGADA') {
    return;
  }

  const pagoExistente = await Pago.findOne({
    where: {
      orden_id: orden.id,
      referencia: `REC-EMPLEADO-${orden.id}`
    }
  });

  if (pagoExistente) {
    return;
  }

  await Pago.create({
    orden_id: orden.id,
    reservacion_id: null,
    tipo_pago_id: null,
    monto: 0,
    estado: 'PAGADO',
    referencia: `REC-EMPLEADO-${orden.id}`,
    fecha_pago: new Date(),
    fecha_creacion: new Date()
  });
}

async function actualizarEstadoOrden(req, res) {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!['PENDIENTE', 'EN_COCINA', 'LISTA', 'ENTREGADA', 'CANCELADA'].includes(estado)) {
      return res.status(400).json({
        mensaje: 'Estado de orden inválido'
      });
    }

    const orden = await Orden.findByPk(id);

    if (!orden) {
      return res.status(404).json({
        mensaje: 'Orden no encontrada'
      });
    }

    orden.estado = estado;
    orden.fecha_actualizacion = new Date();

    await orden.save();

    if (estado === 'LISTA') {
      await OrdenDetalle.update(
        {
          estado_cocina: 'LISTO',
          fecha_actualizacion: new Date()
        },
        {
          where: {
            orden_id: orden.id,
            estado_cocina: {
              [Op.ne]: 'ENTREGADO'
            }
          }
        }
      );
    }

    if (estado === 'ENTREGADA') {
      await OrdenDetalle.update(
        {
          estado_cocina: 'ENTREGADO',
          fecha_actualizacion: new Date()
        },
        {
          where: {
            orden_id: orden.id
          }
        }
      );
    }

    await asegurarPagoEmpleadoSiCorresponde(orden);

    return res.json({
      mensaje: 'Estado de orden actualizado correctamente',
      orden: await formatearOrden(orden)
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al actualizar estado de orden'
    });
  }
}

async function actualizarEstadoDetalleCocina(req, res) {
  try {
    const { detalleId } = req.params;
    const { estado_cocina } = req.body;

    if (!['PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO'].includes(estado_cocina)) {
      return res.status(400).json({
        mensaje: 'Estado de cocina inválido'
      });
    }

    const detalle = await OrdenDetalle.findByPk(detalleId);

    if (!detalle) {
      return res.status(404).json({
        mensaje: 'Detalle de orden no encontrado'
      });
    }

    detalle.estado_cocina = estado_cocina;
    detalle.fecha_actualizacion = new Date();

    await detalle.save();

    if (estado_cocina === 'EN_PREPARACION') {
      const orden = await Orden.findByPk(detalle.orden_id);

      if (orden && orden.estado === 'PENDIENTE') {
        orden.estado = 'EN_COCINA';
        orden.fecha_actualizacion = new Date();
        await orden.save();
      }
    }

    const detallesOrden = await OrdenDetalle.findAll({
      where: {
        orden_id: detalle.orden_id
      }
    });

    const todosListos = detallesOrden.length > 0 && detallesOrden.every((item) => {
      return item.estado_cocina === 'LISTO' || item.estado_cocina === 'ENTREGADO';
    });

    if (todosListos) {
      const orden = await Orden.findByPk(detalle.orden_id);

      if (orden && orden.estado !== 'ENTREGADA') {
        orden.estado = 'LISTA';
        orden.fecha_actualizacion = new Date();
        await orden.save();
      }
    }

    return res.json({
      mensaje: 'Estado de cocina actualizado correctamente',
      detalle: await formatearDetalle(detalle),
      orden: await formatearOrden(await Orden.findByPk(detalle.orden_id))
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al actualizar estado de cocina'
    });
  }
}


async function cancelarOrden(req, res) {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const orden = await Orden.findByPk(id);

    if (!orden) {
      return res.status(404).json({
        mensaje: 'Orden no encontrada'
      });
    }

    if (orden.estado === 'CANCELADA') {
      return res.status(400).json({
        mensaje: 'La orden ya está cancelada'
      });
    }

    if (orden.estado === 'ENTREGADA') {
      return res.status(400).json({
        mensaje: 'No se puede cancelar una orden ya realizada o entregada'
      });
    }

    await devolverInventarioDeOrden(orden, obtenerUsuarioId(req), motivo || 'Cancelación de orden');

    orden.estado = 'CANCELADA';
    orden.motivo_cancelacion = motivo || null;
    orden.fecha_cancelacion = new Date();
    orden.fecha_actualizacion = new Date();
    await orden.save();

    await OrdenDetalle.update(
      {
        fecha_actualizacion: new Date()
      },
      {
        where: {
          orden_id: orden.id
        }
      }
    );

    await ReservacionCargo.update(
      {
        estado: 'ANULADO'
      },
      {
        where: {
          orden_id: orden.id,
          estado: 'PENDIENTE'
        }
      }
    );

    return res.json({
      mensaje: 'Orden cancelada correctamente. Inventario revertido.',
      orden: await formatearOrden(orden)
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al cancelar orden'
    });
  }
}


async function ordenTienePago(ordenId) {
  const pago = await Pago.findOne({
    where: {
      orden_id: ordenId,
      estado: 'PAGADO'
    }
  });

  return Boolean(pago);
}

async function obtenerOrdenesMesaPendientes(numeroMesa) {
  const where = {
    tipo_orden: 'MESA',
    estado: 'ENTREGADA'
  };

  if (numeroMesa) {
    where.numero_mesa = String(numeroMesa);
  }

  const ordenes = await Orden.findAll({
    where,
    order: [['numero_mesa', 'ASC'], ['fecha_creacion', 'ASC'], ['id', 'ASC']]
  });

  const pendientes = [];

  for (const orden of ordenes) {
    const pagada = await ordenTienePago(orden.id);

    if (!pagada) {
      pendientes.push(orden);
    }
  }

  return pendientes;
}

async function construirFacturaMesa(numeroMesa) {
  const ordenesPendientes = await obtenerOrdenesMesaPendientes(numeroMesa);
  const ordenesFormateadas = await Promise.all(ordenesPendientes.map(formatearOrden));
  const total = ordenesPendientes.reduce((acumulado, orden) => acumulado + numero(orden.total), 0);

  return {
    numero: `MESA-${numeroMesa}`,
    numero_mesa: String(numeroMesa),
    estado: ordenesPendientes.length > 0 ? 'PENDIENTE' : 'SIN_PENDIENTES',
    ordenes: ordenesFormateadas,
    subtotal: redondear2(total),
    total_a_pagar: redondear2(total),
    total_pagado: 0,
    saldo: redondear2(total),
    fecha_creacion: ordenesPendientes[0]?.fecha_creacion || null,
    fecha_actualizacion: ordenesPendientes[ordenesPendientes.length - 1]?.fecha_actualizacion || null
  };
}

async function listarMesasPendientesPago(req, res) {
  try {
    const ordenesPendientes = await obtenerOrdenesMesaPendientes();
    const mesasMap = new Map();

    for (const orden of ordenesPendientes) {
      const numeroMesa = orden.numero_mesa || 'Sin mesa';
      const mesa = mesasMap.get(numeroMesa) || {
        numero_mesa: numeroMesa,
        cantidad_ordenes: 0,
        total_a_pagar: 0,
        primera_orden: orden.fecha_creacion,
        ultima_orden: orden.fecha_creacion
      };

      mesa.cantidad_ordenes += 1;
      mesa.total_a_pagar += numero(orden.total);

      if (new Date(orden.fecha_creacion).getTime() < new Date(mesa.primera_orden).getTime()) {
        mesa.primera_orden = orden.fecha_creacion;
      }

      if (new Date(orden.fecha_creacion).getTime() > new Date(mesa.ultima_orden).getTime()) {
        mesa.ultima_orden = orden.fecha_creacion;
      }

      mesasMap.set(numeroMesa, mesa);
    }

    const mesas = Array.from(mesasMap.values()).map((mesa) => ({
      ...mesa,
      total_a_pagar: redondear2(mesa.total_a_pagar)
    }));

    return res.json({
      mensaje: 'Mesas pendientes de pago obtenidas correctamente',
      mesas
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al listar mesas pendientes de pago'
    });
  }
}

async function obtenerFacturaMesa(req, res) {
  try {
    const { numeroMesa } = req.params;
    const factura = await construirFacturaMesa(numeroMesa);

    return res.json({
      mensaje: 'Factura de mesa obtenida correctamente',
      factura
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al obtener factura de mesa'
    });
  }
}

async function pagarFacturaMesa(req, res) {
  try {
    const { numeroMesa } = req.params;
    const { tipo_pago_id } = req.body;

    if (!tipo_pago_id) {
      return res.status(400).json({
        mensaje: 'tipo_pago_id es obligatorio'
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

    const ordenesPendientes = await obtenerOrdenesMesaPendientes(numeroMesa);

    if (ordenesPendientes.length === 0) {
      return res.status(400).json({
        mensaje: 'La mesa no tiene órdenes pendientes de pago'
      });
    }

    const fechaPago = new Date();
    const referencia = `FACT-MESA-${numeroMesa}-${fechaPago.getTime()}`;
    let totalPagado = 0;

    for (const orden of ordenesPendientes) {
      const monto = numero(orden.total);
      totalPagado += monto;

      await Pago.create({
        orden_id: orden.id,
        reservacion_id: null,
        tipo_pago_id: tipoPago.id,
        monto,
        estado: 'PAGADO',
        referencia,
        fecha_pago: fechaPago,
        fecha_creacion: fechaPago
      });

      orden.fecha_actualizacion = fechaPago;
      await orden.save();
    }

    const ordenesFormateadas = await Promise.all(ordenesPendientes.map(formatearOrden));

    return res.json({
      mensaje: 'Factura de mesa pagada correctamente',
      pago: {
        referencia,
        tipo_pago: {
          id: tipoPago.id,
          codigo: tipoPago.codigo,
          nombre: tipoPago.nombre
        },
        total_pagado: redondear2(totalPagado),
        fecha_pago: fechaPago
      },
      factura: {
        numero: referencia,
        numero_mesa: String(numeroMesa),
        estado: 'PAGADA',
        ordenes: ordenesFormateadas,
        subtotal: redondear2(totalPagado),
        total_a_pagar: redondear2(totalPagado),
        total_pagado: redondear2(totalPagado),
        saldo: 0,
        tipo_pago: {
          id: tipoPago.id,
          codigo: tipoPago.codigo,
          nombre: tipoPago.nombre
        },
        fecha_pago: fechaPago
      }
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al pagar factura de mesa'
    });
  }
}

function construirClaveFacturaOrden(orden) {
  if (orden.tipo_orden === 'MESA') {
    return `MESA-${orden.numero_mesa || 'SIN-MESA'}`;
  }

  if (orden.tipo_orden === 'LLEVAR') {
    return `LLEVAR-${orden.id}`;
  }

  if (orden.tipo_orden === 'EMPLEADO') {
    return `EMPLEADO-${orden.id}`;
  }

  return `ORDEN-${orden.id}`;
}

function parsearClaveFacturaRestaurante(clave) {
  const valor = decodeURIComponent(String(clave || ''));

  if (valor.startsWith('MESA-')) {
    return {
      tipo_orden: 'MESA',
      numero_mesa: valor.replace('MESA-', '')
    };
  }

  if (valor.startsWith('LLEVAR-')) {
    return {
      tipo_orden: 'LLEVAR',
      orden_id: Number(valor.replace('LLEVAR-', ''))
    };
  }

  return null;
}

async function obtenerOrdenesDirectasPendientes(clave) {
  const where = {
    estado: 'ENTREGADA',
    tipo_orden: {
      [Op.in]: ['MESA', 'LLEVAR']
    }
  };

  const datosClave = clave ? parsearClaveFacturaRestaurante(clave) : null;

  if (clave && !datosClave) {
    return [];
  }

  if (datosClave?.tipo_orden === 'MESA') {
    where.tipo_orden = 'MESA';
    where.numero_mesa = String(datosClave.numero_mesa);
  }

  if (datosClave?.tipo_orden === 'LLEVAR') {
    where.tipo_orden = 'LLEVAR';
    where.id = datosClave.orden_id || 0;
  }

  const ordenes = await Orden.findAll({
    where,
    order: [['tipo_orden', 'ASC'], ['numero_mesa', 'ASC'], ['fecha_creacion', 'ASC'], ['id', 'ASC']]
  });

  const pendientes = [];

  for (const orden of ordenes) {
    const pagada = await ordenTienePago(orden.id);

    if (!pagada) {
      pendientes.push(orden);
    }
  }

  return pendientes;
}

function obtenerTituloFacturaDirecta(orden) {
  if (orden.tipo_orden === 'MESA') {
    return `Mesa ${orden.numero_mesa || 'Sin número'}`;
  }

  if (orden.tipo_orden === 'LLEVAR') {
    return `Para llevar #${orden.id}`;
  }

  if (orden.tipo_orden === 'EMPLEADO') {
    return `Consumo empleado #${orden.id}`;
  }

  if (orden.tipo_orden === 'EVENTO') {
    return `Evento #${orden.evento_id || orden.id}`;
  }

  if (orden.tipo_orden === 'CREDITO') {
    return `Crédito #${orden.credito_id || orden.id}`;
  }

  return `Orden #${orden.id}`;
}

async function construirFacturaRestaurantePendiente(clave) {
  const ordenesPendientes = await obtenerOrdenesDirectasPendientes(clave);
  const primeraOrden = ordenesPendientes[0] || null;
  const datosClave = clave ? parsearClaveFacturaRestaurante(clave) : null;
  const claveFinal = clave || (primeraOrden ? construirClaveFacturaOrden(primeraOrden) : 'SIN-PENDIENTES');
  const total = ordenesPendientes.reduce((acumulado, orden) => acumulado + numero(orden.total), 0);
  const titulo = primeraOrden
    ? obtenerTituloFacturaDirecta(primeraOrden)
    : datosClave?.tipo_orden === 'MESA'
      ? `Mesa ${datosClave.numero_mesa}`
      : datosClave?.tipo_orden === 'LLEVAR'
        ? `Para llevar #${datosClave.orden_id}`
        : 'Factura restaurante';

  return {
    numero: `FACT-${claveFinal}`,
    clave: claveFinal,
    tipo_orden: primeraOrden?.tipo_orden || datosClave?.tipo_orden || null,
    titulo,
    numero_mesa: primeraOrden?.numero_mesa || datosClave?.numero_mesa || null,
    orden_id: primeraOrden?.tipo_orden === 'LLEVAR' ? primeraOrden.id : datosClave?.orden_id || null,
    estado: ordenesPendientes.length > 0 ? 'PENDIENTE' : 'SIN_PENDIENTES',
    ordenes: await Promise.all(ordenesPendientes.map(formatearOrden)),
    subtotal: redondear2(total),
    total_a_pagar: redondear2(total),
    total_pagado: 0,
    saldo: redondear2(total),
    fecha_creacion: ordenesPendientes[0]?.fecha_creacion || null,
    fecha_actualizacion: ordenesPendientes[ordenesPendientes.length - 1]?.fecha_actualizacion || null
  };
}

async function listarFacturasPendientesPago(req, res) {
  try {
    const ordenesPendientes = await obtenerOrdenesDirectasPendientes();
    const facturasMap = new Map();

    for (const orden of ordenesPendientes) {
      const clave = construirClaveFacturaOrden(orden);
      const factura = facturasMap.get(clave) || {
        clave,
        tipo_orden: orden.tipo_orden,
        titulo: obtenerTituloFacturaDirecta(orden),
        numero_mesa: orden.tipo_orden === 'MESA' ? orden.numero_mesa || null : null,
        orden_id: orden.tipo_orden === 'LLEVAR' ? orden.id : null,
        cantidad_ordenes: 0,
        total_a_pagar: 0,
        primera_orden: orden.fecha_creacion,
        ultima_orden: orden.fecha_creacion
      };

      factura.cantidad_ordenes += 1;
      factura.total_a_pagar += numero(orden.total);

      if (new Date(orden.fecha_creacion).getTime() < new Date(factura.primera_orden).getTime()) {
        factura.primera_orden = orden.fecha_creacion;
      }

      if (new Date(orden.fecha_creacion).getTime() > new Date(factura.ultima_orden).getTime()) {
        factura.ultima_orden = orden.fecha_creacion;
      }

      facturasMap.set(clave, factura);
    }

    const facturas = Array.from(facturasMap.values()).map((factura) => ({
      ...factura,
      total_a_pagar: redondear2(factura.total_a_pagar)
    }));

    return res.json({
      mensaje: 'Facturas pendientes de pago obtenidas correctamente',
      facturas
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: 'Error al listar facturas pendientes de pago' });
  }
}

async function obtenerFacturaRestaurantePendiente(req, res) {
  try {
    const { clave } = req.params;
    const factura = await construirFacturaRestaurantePendiente(clave);

    return res.json({
      mensaje: 'Factura de restaurante obtenida correctamente',
      factura
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: 'Error al obtener factura de restaurante' });
  }
}

async function pagarFacturaRestaurantePendiente(req, res) {
  try {
    const { clave } = req.params;
    const { tipo_pago_id } = req.body;

    if (!tipo_pago_id) {
      return res.status(400).json({ mensaje: 'tipo_pago_id es obligatorio' });
    }

    const tipoPago = await TipoPago.findOne({
      where: {
        id: tipo_pago_id,
        estado: true
      }
    });

    if (!tipoPago) {
      return res.status(404).json({ mensaje: 'Tipo de pago no encontrado o inactivo' });
    }

    const ordenesPendientes = await obtenerOrdenesDirectasPendientes(clave);

    if (ordenesPendientes.length === 0) {
      return res.status(400).json({ mensaje: 'No hay órdenes pendientes para esta factura' });
    }

    const datosClave = parsearClaveFacturaRestaurante(clave);
    const fechaPago = new Date();
    const referencia = datosClave?.tipo_orden === 'MESA'
      ? `FACT-MESA-${datosClave.numero_mesa}-${fechaPago.getTime()}`
      : datosClave?.tipo_orden === 'LLEVAR'
        ? `FACT-LLEVAR-${datosClave.orden_id}-${fechaPago.getTime()}`
        : `FACT-ORDEN-${fechaPago.getTime()}`;
    let totalPagado = 0;

    for (const orden of ordenesPendientes) {
      const monto = numero(orden.total);
      totalPagado += monto;

      await Pago.create({
        orden_id: orden.id,
        reservacion_id: null,
        tipo_pago_id: tipoPago.id,
        monto,
        estado: 'PAGADO',
        referencia,
        fecha_pago: fechaPago,
        fecha_creacion: fechaPago
      });

      orden.fecha_actualizacion = fechaPago;
      await orden.save();
    }

    const ordenesFormateadas = await Promise.all(ordenesPendientes.map(formatearOrden));
    const primeraOrden = ordenesPendientes[0];

    return res.json({
      mensaje: 'Factura de restaurante pagada correctamente',
      pago: {
        referencia,
        tipo_pago: {
          id: tipoPago.id,
          codigo: tipoPago.codigo,
          nombre: tipoPago.nombre
        },
        total_pagado: redondear2(totalPagado),
        fecha_pago: fechaPago
      },
      factura: {
        numero: referencia,
        clave,
        tipo_orden: primeraOrden.tipo_orden,
        titulo: obtenerTituloFacturaDirecta(primeraOrden),
        numero_mesa: primeraOrden.numero_mesa || null,
        orden_id: primeraOrden.tipo_orden === 'LLEVAR' ? primeraOrden.id : null,
        estado: 'PAGADA',
        ordenes: ordenesFormateadas,
        subtotal: redondear2(totalPagado),
        total_a_pagar: redondear2(totalPagado),
        total_pagado: redondear2(totalPagado),
        saldo: 0,
        tipo_pago: {
          id: tipoPago.id,
          codigo: tipoPago.codigo,
          nombre: tipoPago.nombre
        },
        fecha_pago: fechaPago
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: 'Error al pagar factura de restaurante' });
  }
}

function obtenerRangoFacturas(tipo, fechaTexto, anioTexto, mesTexto) {
  if (tipo === 'MES') {
    const fechaActual = new Date();
    const anio = Number(anioTexto || fechaActual.getFullYear());
    const mes = Number(mesTexto || fechaActual.getMonth() + 1);

    if (!anio || !mes || mes < 1 || mes > 12) return null;

    return {
      inicio: new Date(anio, mes - 1, 1, 0, 0, 0, 0),
      fin: new Date(anio, mes, 0, 23, 59, 59, 999),
      anio,
      mes
    };
  }

  const rangoDiaBase = rangoDia(fechaTexto);
  if (!rangoDiaBase) return null;

  if (tipo === 'SEMANA') {
    const fecha = new Date(rangoDiaBase.inicio);
    const diaSemana = fecha.getDay();
    const diasDesdeLunes = diaSemana === 0 ? 6 : diaSemana - 1;
    const inicio = new Date(fecha);
    inicio.setDate(inicio.getDate() - diasDesdeLunes);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 6);
    fin.setHours(23, 59, 59, 999);
    return { inicio, fin };
  }

  return rangoDiaBase;
}

async function listarFacturasRestaurante(req, res) {
  try {
    const tipo = String(req.query.tipo || 'DIA').toUpperCase();

    if (!['DIA', 'SEMANA', 'MES'].includes(tipo)) {
      return res.status(400).json({
        mensaje: 'tipo debe ser DIA, SEMANA o MES'
      });
    }

    const rango = obtenerRangoFacturas(tipo, req.query.fecha, req.query.anio, req.query.mes);

    if (!rango) {
      return res.status(400).json({
        mensaje: 'Rango de fechas inválido'
      });
    }

    const pagos = await Pago.findAll({
      where: {
        orden_id: {
          [Op.ne]: null
        },
        estado: 'PAGADO',
        fecha_pago: {
          [Op.between]: [rango.inicio, rango.fin]
        }
      },
      order: [['fecha_pago', 'DESC'], ['id', 'DESC']]
    });

    const facturasMap = new Map();

    for (const pago of pagos) {
      const clave = pago.referencia || `PAGO-${pago.id}`;
      const orden = await Orden.findByPk(pago.orden_id);
      const tipoPago = pago.tipo_pago_id ? await TipoPago.findByPk(pago.tipo_pago_id) : null;

      const factura = facturasMap.get(clave) || {
        referencia: clave,
        tipo_factura: 'RESTAURANTE',
        tipo_pago: tipoPago
          ? {
              id: tipoPago.id,
              codigo: tipoPago.codigo,
              nombre: tipoPago.nombre
            }
          : null,
        cliente: orden?.tipo_orden === 'MESA'
          ? `Mesa ${orden.numero_mesa || 'Sin número'}`
          : orden?.tipo_orden === 'LLEVAR'
            ? 'Para llevar'
            : orden?.tipo_orden === 'EMPLEADO'
              ? 'Consumo empleado'
              : orden?.tipo_orden === 'EVENTO'
                ? `Evento #${orden.evento_id || orden.id}`
                : orden?.tipo_orden === 'CREDITO'
                  ? `Crédito #${orden.credito_id || orden.id}`
                  : 'Restaurante',
        numero_mesa: orden?.numero_mesa || null,
        cantidad_ordenes: 0,
        total: 0,
        fecha_pago: pago.fecha_pago,
        ordenes: []
      };

      factura.cantidad_ordenes += 1;
      factura.total += numero(pago.monto);

      if (orden) {
        factura.ordenes.push(await formatearOrden(orden));
      }

      if (new Date(pago.fecha_pago).getTime() > new Date(factura.fecha_pago).getTime()) {
        factura.fecha_pago = pago.fecha_pago;
      }

      facturasMap.set(clave, factura);
    }

    const facturas = Array.from(facturasMap.values()).map((factura) => ({
      ...factura,
      total: redondear2(factura.total)
    }));

    const total = facturas.reduce((acumulado, factura) => acumulado + numero(factura.total), 0);

    return res.json({
      mensaje: 'Facturas de restaurante obtenidas correctamente',
      reporte: {
        tipo,
        rango: {
          inicio: rango.inicio,
          fin: rango.fin
        },
        anio: rango.anio,
        mes: rango.mes,
        resumen: {
          total_facturado: redondear2(total),
          cantidad_facturas: facturas.length
        },
        facturas
      }
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al listar facturas de restaurante'
    });
  }
}

module.exports = {
  crearOrden,
  listarOrdenes,
  listarOrdenesCocinaHoy,
  actualizarEstadoOrden,
  actualizarEstadoDetalleCocina,
  cancelarOrden,
  listarMesasPendientesPago,
  obtenerFacturaMesa,
  pagarFacturaMesa,
  listarFacturasPendientesPago,
  obtenerFacturaRestaurantePendiente,
  pagarFacturaRestaurantePendiente,
  listarFacturasRestaurante,
  formatearOrden
};
