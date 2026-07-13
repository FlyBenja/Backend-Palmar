const { Op } = require('sequelize');

const Reservacion = require('../../../models/Reservacion');
const Habitacion = require('../../../models/Habitacion');
const EstadoHabitacion = require('../../../models/EstadoHabitacion');
const EstadoReservacion = require('../../../models/EstadoReservacion');

const ESTADOS_HABITACION_MANUALES = [
  'LIMPIEZA',
  'MANTENIMIENTO',
  'INACTIVA'
];

function convertirFechaSoloDia(valor) {
  if (!valor) return null;

  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [anio, mes, dia] = valor.split('-').map(Number);
    return new Date(Date.UTC(anio, mes - 1, dia, 0, 0, 0, 0));
  }

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return null;
  }

  return new Date(Date.UTC(
    fecha.getUTCFullYear(),
    fecha.getUTCMonth(),
    fecha.getUTCDate(),
    0,
    0,
    0,
    0
  ));
}

function obtenerFechaActualSoloDia() {
  const hoy = new Date();

  return new Date(Date.UTC(
    hoy.getUTCFullYear(),
    hoy.getUTCMonth(),
    hoy.getUTCDate(),
    0,
    0,
    0,
    0
  ));
}

function sumarDiasAFecha(fechaEntrada, dias) {
  const fechaSalida = new Date(fechaEntrada);
  fechaSalida.setUTCDate(fechaSalida.getUTCDate() + Number(dias));
  fechaSalida.setUTCHours(0, 0, 0, 0);

  return fechaSalida;
}

function calcularTotalReservacion(precioTarifa, dias) {
  const precio = Number(precioTarifa || 0);
  const cantidadDias = Number(dias || 0);

  return precio * cantidadDias;
}

async function obtenerEstadoHabitacionPorCodigo(codigo) {
  const estadoHabitacion = await EstadoHabitacion.findOne({
    where: {
      codigo,
      estado: true
    }
  });

  if (!estadoHabitacion) {
    throw new Error(`No existe el estado de habitación: ${codigo}`);
  }

  return estadoHabitacion;
}

async function obtenerEstadoReservacionPorCodigo(codigo) {
  const estadoReservacion = await EstadoReservacion.findOne({
    where: {
      codigo,
      estado: true
    }
  });

  if (!estadoReservacion) {
    throw new Error(`No existe el estado de reservación: ${codigo}`);
  }

  return estadoReservacion;
}

async function cambiarEstadoHabitacion(habitacion, codigoEstado) {
  const estadoHabitacion = await obtenerEstadoHabitacionPorCodigo(codigoEstado);

  habitacion.estado_id = estadoHabitacion.id;
  habitacion.fecha_actualizacion = new Date();

  await habitacion.save();

  return habitacion;
}

async function marcarHabitacionDisponible(habitacionId) {
  const habitacion = await Habitacion.findByPk(habitacionId);

  if (!habitacion) {
    return null;
  }

  return cambiarEstadoHabitacion(habitacion, 'DISPONIBLE');
}

async function actualizarEstadoHabitacionSegunReservaciones(habitacionId, opciones = {}) {
  const respetarEstadosManuales = opciones.respetarEstadosManuales !== false;

  const habitacion = await Habitacion.findByPk(habitacionId, {
    include: [
      {
        model: EstadoHabitacion,
        as: 'estado_habitacion',
        attributes: ['id', 'codigo', 'nombre']
      }
    ]
  });

  if (!habitacion) {
    return null;
  }

  const estadoActual = habitacion.estado_habitacion
    ? habitacion.estado_habitacion.codigo
    : null;

  if (
    respetarEstadosManuales &&
    ESTADOS_HABITACION_MANUALES.includes(estadoActual)
  ) {
    return habitacion;
  }

  const estadoConfirmada = await obtenerEstadoReservacionPorCodigo('CONFIRMADA');

  const hoy = obtenerFechaActualSoloDia();

  const reservacionActiva = await Reservacion.findOne({
    where: {
      habitacion_id: habitacionId,
      estado_reservacion_id: estadoConfirmada.id,
      fecha_entrada: {
        [Op.lte]: hoy
      },
      fecha_salida: {
        [Op.gte]: hoy
      }
    },
    order: [['fecha_entrada', 'ASC']]
  });

  if (reservacionActiva) {
    return cambiarEstadoHabitacion(habitacion, 'OCUPADA');
  }

  const reservacionFutura = await Reservacion.findOne({
    where: {
      habitacion_id: habitacionId,
      estado_reservacion_id: estadoConfirmada.id,
      fecha_entrada: {
        [Op.gt]: hoy
      }
    },
    order: [['fecha_entrada', 'ASC']]
  });

  if (reservacionFutura) {
    return cambiarEstadoHabitacion(habitacion, 'RESERVADA');
  }

  return cambiarEstadoHabitacion(habitacion, 'DISPONIBLE');
}

async function actualizarEstadosHabitacionesSegunReservaciones() {
  const habitaciones = await Habitacion.findAll();

  for (const habitacion of habitaciones) {
    await actualizarEstadoHabitacionSegunReservaciones(habitacion.id);
  }
}

module.exports = {
  convertirFechaSoloDia,
  obtenerFechaActualSoloDia,
  sumarDiasAFecha,
  calcularTotalReservacion,
  obtenerEstadoHabitacionPorCodigo,
  obtenerEstadoReservacionPorCodigo,
  actualizarEstadoHabitacionSegunReservaciones,
  actualizarEstadosHabitacionesSegunReservaciones,
  marcarHabitacionDisponible,
  ESTADOS_HABITACION_MANUALES
};