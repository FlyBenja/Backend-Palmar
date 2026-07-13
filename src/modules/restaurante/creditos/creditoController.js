const { Op } = require('sequelize');
const Credito = require('../../../models/Credito');
const CreditoCargo = require('../../../models/CreditoCargo');
const Habitacion = require('../../../models/Habitacion');
const EstadoHabitacion = require('../../../models/EstadoHabitacion');
const Orden = require('../../../models/Orden');
const Pago = require('../../../models/Pago');
const TipoPago = require('../../../models/TipoPago');
const { formatearOrden } = require('../ordenes/ordenController');

function numero(valor) { return Number(valor || 0); }
function redondear2(valor) { return Math.round(numero(valor) * 100) / 100; }

function formatearCredito(credito) {
  const data = credito.toJSON ? credito.toJSON() : credito;
  return {
    id: data.id,
    cliente_nombre: data.cliente_nombre,
    nit: data.nit,
    telefono: data.telefono,
    empresa: data.empresa,
    descripcion: data.descripcion,
    estado: data.estado,
    total: data.total,
    tipo_pago_id: data.tipo_pago_id,
    fecha_pago: data.fecha_pago,
    fecha_creacion: data.fecha_creacion,
    fecha_actualizacion: data.fecha_actualizacion,
  };
}

function formatearCargo(cargo) {
  const data = cargo.toJSON ? cargo.toJSON() : cargo;
  return {
    id: data.id,
    credito_id: data.credito_id,
    orden_id: data.orden_id,
    reservacion_id: data.reservacion_id,
    tipo_cargo: data.tipo_cargo,
    descripcion: data.descripcion,
    monto: data.monto,
    estado: data.estado,
    fecha_cargo: data.fecha_cargo,
    fecha_creacion: data.fecha_creacion,
  };
}

async function recalcularCredito(creditoId) {
  const cargos = await CreditoCargo.findAll({ where: { credito_id: creditoId, estado: { [Op.ne]: 'ANULADO' } } });
  const total = cargos.reduce((acc, cargo) => acc + numero(cargo.monto), 0);
  const credito = await Credito.findByPk(creditoId);
  if (credito) {
    credito.total = redondear2(total);
    credito.fecha_actualizacion = new Date();
    await credito.save();
  }
  return credito;
}

async function listarCreditos(req, res) {
  try {
    const where = {};
    if (req.query.estado) where.estado = req.query.estado;

    if (req.query.fecha_inicio || req.query.fecha_fin) {
      const fechaInicio = req.query.fecha_inicio ? new Date(`${req.query.fecha_inicio}T00:00:00`) : null;
      const fechaFin = req.query.fecha_fin ? new Date(`${req.query.fecha_fin}T23:59:59.999`) : null;

      where.fecha_creacion = {};
      if (fechaInicio && !Number.isNaN(fechaInicio.getTime())) where.fecha_creacion[Op.gte] = fechaInicio;
      if (fechaFin && !Number.isNaN(fechaFin.getTime())) where.fecha_creacion[Op.lte] = fechaFin;
    }

    const creditos = await Credito.findAll({ where, order: [['fecha_creacion', 'DESC'], ['id', 'DESC']] });
    return res.json({ mensaje: 'Créditos obtenidos correctamente', creditos: creditos.map(formatearCredito) });
  } catch (error) {
    console.error(error); return res.status(500).json({ mensaje: 'Error al listar créditos' });
  }
}

async function crearCredito(req, res) {
  try {
    const { cliente_nombre, nit, telefono, empresa, descripcion } = req.body;
    if (!cliente_nombre) return res.status(400).json({ mensaje: 'cliente_nombre es obligatorio' });
    const credito = await Credito.create({ cliente_nombre, nit: nit || null, telefono: telefono || null, empresa: empresa || null, descripcion: descripcion || null, estado: 'PENDIENTE', total: 0, fecha_creacion: new Date(), fecha_actualizacion: null });
    return res.status(201).json({ mensaje: 'Crédito creado correctamente', credito: formatearCredito(credito) });
  } catch (error) {
    console.error(error); return res.status(500).json({ mensaje: 'Error al crear crédito' });
  }
}

async function agregarCargoCredito(req, res) {
  try {
    const credito = await Credito.findByPk(req.params.id);
    if (!credito) return res.status(404).json({ mensaje: 'Crédito no encontrado' });
    if (credito.estado !== 'PENDIENTE') return res.status(400).json({ mensaje: 'El crédito no está pendiente' });
    const { tipo_cargo, descripcion, monto, reservacion_id, habitacion_id } = req.body;
    if (!descripcion || monto === undefined || monto === null) return res.status(400).json({ mensaje: 'descripcion y monto son obligatorios' });

    if (tipo_cargo === 'HABITACION' && habitacion_id) {
      const habitacion = await Habitacion.findByPk(habitacion_id);
      if (!habitacion) return res.status(404).json({ mensaje: 'Habitación no encontrada' });
      const estadoOcupada = await EstadoHabitacion.findOne({ where: { codigo: 'OCUPADA' } });
      if (estadoOcupada) {
        habitacion.estado_id = estadoOcupada.id;
        habitacion.fecha_actualizacion = new Date();
        await habitacion.save();
      }
    }

    const cargo = await CreditoCargo.create({ credito_id: credito.id, reservacion_id: reservacion_id || null, tipo_cargo: tipo_cargo || 'MANUAL', descripcion, monto: numero(monto), estado: 'PENDIENTE', fecha_cargo: new Date(), fecha_creacion: new Date() });
    await recalcularCredito(credito.id);
    return res.status(201).json({ mensaje: 'Cargo agregado al crédito', cargo: formatearCargo(cargo), credito: formatearCredito(await Credito.findByPk(credito.id)) });
  } catch (error) {
    console.error(error); return res.status(500).json({ mensaje: 'Error al agregar cargo al crédito' });
  }
}

async function construirFacturaCredito(id) {
  const credito = await Credito.findByPk(id);
  if (!credito) return null;
  const cargos = await CreditoCargo.findAll({ where: { credito_id: credito.id, estado: { [Op.ne]: 'ANULADO' } }, order: [['fecha_cargo', 'ASC'], ['id', 'ASC']] });
  const ordenes = await Orden.findAll({ where: { credito_id: credito.id, estado: { [Op.ne]: 'CANCELADA' } }, order: [['fecha_creacion', 'ASC'], ['id', 'ASC']] });
  const total = redondear2(cargos.reduce((acc, cargo) => acc + numero(cargo.monto), 0));
  const tipoPago = credito.tipo_pago_id ? await TipoPago.findByPk(credito.tipo_pago_id) : null;
  return {
    numero: `REC-CREDITO-${credito.id}`,
    credito: formatearCredito(credito),
    cargos: cargos.map(formatearCargo),
    ordenes: await Promise.all(ordenes.map(formatearOrden)),
    subtotal: total,
    total_a_pagar: total,
    total_pagado: credito.estado === 'PAGADO' ? total : 0,
    saldo: credito.estado === 'PAGADO' ? 0 : total,
    tipo_pago: tipoPago ? { id: tipoPago.id, codigo: tipoPago.codigo, nombre: tipoPago.nombre } : null,
  };
}

async function obtenerFacturaCredito(req, res) {
  try {
    const factura = await construirFacturaCredito(req.params.id);
    if (!factura) return res.status(404).json({ mensaje: 'Crédito no encontrado' });
    return res.json({ mensaje: 'Recibo de crédito obtenido correctamente', factura });
  } catch (error) {
    console.error(error); return res.status(500).json({ mensaje: 'Error al obtener recibo de crédito' });
  }
}

async function pagarCredito(req, res) {
  try {
    const { tipo_pago_id } = req.body;
    if (!tipo_pago_id) return res.status(400).json({ mensaje: 'tipo_pago_id es obligatorio' });
    const credito = await Credito.findByPk(req.params.id);
    if (!credito) return res.status(404).json({ mensaje: 'Crédito no encontrado' });
    if (credito.estado !== 'PENDIENTE') return res.status(400).json({ mensaje: 'El crédito no está pendiente' });
    const tipoPago = await TipoPago.findOne({ where: { id: tipo_pago_id, estado: true } });
    if (!tipoPago) return res.status(404).json({ mensaje: 'Tipo de pago no encontrado' });

    await recalcularCredito(credito.id);
    const cargos = await CreditoCargo.findAll({ where: { credito_id: credito.id, estado: 'PENDIENTE' }, order: [['id', 'ASC']] });
    const fechaPago = new Date();
    const referencia = `REC-CREDITO-${credito.id}-${fechaPago.getTime()}`;

    for (const cargo of cargos) {
      if (cargo.orden_id) {
        const pagoExistente = await Pago.findOne({ where: { orden_id: cargo.orden_id, estado: 'PAGADO' } });
        if (!pagoExistente) {
          await Pago.create({ orden_id: cargo.orden_id, reservacion_id: null, tipo_pago_id: tipoPago.id, monto: numero(cargo.monto), estado: 'PAGADO', referencia, fecha_pago: fechaPago, fecha_creacion: fechaPago });
        }
      } else {
        await Pago.create({ orden_id: null, reservacion_id: cargo.reservacion_id || null, tipo_pago_id: tipoPago.id, monto: numero(cargo.monto), estado: 'PAGADO', referencia: `${referencia}-CARGO-${cargo.id}`, fecha_pago: fechaPago, fecha_creacion: fechaPago });
      }
      cargo.estado = 'PAGADO'; await cargo.save();
    }

    const ordenes = await Orden.findAll({ where: { credito_id: credito.id, estado: { [Op.ne]: 'CANCELADA' } } });
    for (const orden of ordenes) {
      if (orden.estado !== 'ENTREGADA') { orden.estado = 'ENTREGADA'; orden.fecha_actualizacion = fechaPago; await orden.save(); }
    }

    credito.estado = 'PAGADO'; credito.tipo_pago_id = tipoPago.id; credito.fecha_pago = fechaPago; credito.fecha_actualizacion = fechaPago; await credito.save();
    const factura = await construirFacturaCredito(credito.id);
    return res.json({ mensaje: 'Crédito pagado correctamente', factura });
  } catch (error) {
    console.error(error); return res.status(500).json({ mensaje: 'Error al pagar crédito' });
  }
}

module.exports = { listarCreditos, crearCredito, agregarCargoCredito, obtenerFacturaCredito, pagarCredito, recalcularCredito };
