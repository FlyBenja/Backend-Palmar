
const { Op } = require('sequelize');
const Evento = require('../../../models/Evento');
const Pago = require('../../../models/Pago');
const TipoPago = require('../../../models/TipoPago');

function numero(valor) { return Number(valor || 0); }
function redondear2(valor) { return Math.round(numero(valor) * 100) / 100; }

function formatearEvento(evento) {
  const data = evento.toJSON ? evento.toJSON() : evento;
  return {
    id: data.id,
    cliente_nombre: data.cliente_nombre,
    nit: data.nit,
    telefono: data.telefono,
    empresa: data.empresa,
    descripcion: data.descripcion,
    cantidad_personas: data.cantidad_personas || 0,
    monto_cobrado: data.monto_cobrado || data.total || 0,
    fecha_evento: data.fecha_evento,
    estado: data.estado,
    total: data.total,
    tipo_pago_id: data.tipo_pago_id,
    fecha_cierre: data.fecha_cierre,
    fecha_creacion: data.fecha_creacion,
    fecha_actualizacion: data.fecha_actualizacion,
  };
}

async function listarEventos(req, res) {
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

    const eventos = await Evento.findAll({ where, order: [['fecha_creacion', 'DESC'], ['id', 'DESC']] });
    return res.json({ mensaje: 'Eventos obtenidos correctamente', eventos: eventos.map(formatearEvento) });
  } catch (error) {
    console.error(error); return res.status(500).json({ mensaje: 'Error al listar eventos' });
  }
}

async function crearEvento(req, res) {
  try {
    const {
      cliente_nombre,
      nit,
      telefono,
      empresa,
      descripcion,
      fecha_evento,
      cantidad_personas,
      monto_cobrado,
    } = req.body;

    if (!cliente_nombre) return res.status(400).json({ mensaje: 'cliente_nombre es obligatorio' });
    if (!descripcion) return res.status(400).json({ mensaje: 'descripcion es obligatoria' });

    const total = redondear2(monto_cobrado);

    const evento = await Evento.create({
      cliente_nombre,
      nit: nit || null,
      telefono: telefono || null,
      empresa: empresa || null,
      descripcion,
      cantidad_personas: Number(cantidad_personas || 0),
      monto_cobrado: total,
      fecha_evento: fecha_evento || null,
      estado: 'ABIERTO',
      total,
      fecha_creacion: new Date(),
      fecha_actualizacion: null
    });

    return res.status(201).json({ mensaje: 'Evento creado correctamente', evento: formatearEvento(evento) });
  } catch (error) {
    console.error(error); return res.status(500).json({ mensaje: 'Error al crear evento' });
  }
}

async function construirFacturaEvento(id) {
  const evento = await Evento.findByPk(id);
  if (!evento) return null;
  const total = redondear2(evento.total || evento.monto_cobrado || 0);
  const tipoPago = evento.tipo_pago_id ? await TipoPago.findByPk(evento.tipo_pago_id) : null;
  return {
    numero: `REC-EVENTO-${evento.id}`,
    evento: formatearEvento(evento),
    ordenes: [],
    subtotal: total,
    total_a_pagar: total,
    total_pagado: evento.estado === 'CERRADO' ? total : 0,
    saldo: evento.estado === 'CERRADO' ? 0 : total,
    tipo_pago: tipoPago ? { id: tipoPago.id, codigo: tipoPago.codigo, nombre: tipoPago.nombre } : null,
  };
}

async function obtenerFacturaEvento(req, res) {
  try {
    const factura = await construirFacturaEvento(req.params.id);
    if (!factura) return res.status(404).json({ mensaje: 'Evento no encontrado' });
    return res.json({ mensaje: 'Recibo de evento obtenido correctamente', factura });
  } catch (error) {
    console.error(error); return res.status(500).json({ mensaje: 'Error al obtener recibo de evento' });
  }
}

async function cerrarEvento(req, res) {
  try {
    const { tipo_pago_id } = req.body;
    if (!tipo_pago_id) return res.status(400).json({ mensaje: 'tipo_pago_id es obligatorio' });
    const evento = await Evento.findByPk(req.params.id);
    if (!evento) return res.status(404).json({ mensaje: 'Evento no encontrado' });
    if (evento.estado !== 'ABIERTO') return res.status(400).json({ mensaje: 'El evento no está abierto' });
    const tipoPago = await TipoPago.findOne({ where: { id: tipo_pago_id, estado: true } });
    if (!tipoPago) return res.status(404).json({ mensaje: 'Tipo de pago no encontrado' });

    const fechaPago = new Date();
    const referencia = `REC-EVENTO-${evento.id}-${fechaPago.getTime()}`;
    const total = redondear2(evento.total || evento.monto_cobrado || 0);

    await Pago.create({
      orden_id: null,
      reservacion_id: null,
      tipo_pago_id: tipoPago.id,
      monto: total,
      estado: 'PAGADO',
      referencia,
      fecha_pago: fechaPago,
      fecha_creacion: fechaPago
    });

    evento.estado = 'CERRADO';
    evento.total = total;
    evento.monto_cobrado = total;
    evento.tipo_pago_id = tipoPago.id;
    evento.fecha_cierre = fechaPago;
    evento.fecha_actualizacion = fechaPago;
    await evento.save();

    const factura = await construirFacturaEvento(evento.id);
    return res.json({ mensaje: 'Evento cerrado y pagado correctamente', factura });
  } catch (error) {
    console.error(error); return res.status(500).json({ mensaje: 'Error al cerrar evento' });
  }
}

module.exports = { listarEventos, crearEvento, obtenerFacturaEvento, cerrarEvento };
