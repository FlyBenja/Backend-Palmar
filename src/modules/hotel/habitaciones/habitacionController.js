const { Op } = require('sequelize');

const Habitacion = require('../../../models/Habitacion');
const HabitacionImagen = require('../../../models/HabitacionImagen');
const EstadoHabitacion = require('../../../models/EstadoHabitacion');

const {
  actualizarEstadosHabitacionesSegunReservaciones
} = require('../reservaciones/reservacionService');

async function resolverEstadoHabitacionPorId(estado_id) {
  if (estado_id !== undefined && estado_id !== null && estado_id !== '') {
    const estadoEncontrado = await EstadoHabitacion.findOne({
      where: {
        id: estado_id,
        estado: true
      }
    });

    if (!estadoEncontrado) {
      return {
        valido: false,
        mensaje: 'El estado_id enviado no existe o está inactivo'
      };
    }

    return {
      valido: true,
      estado: estadoEncontrado
    };
  }

  const estadoDisponible = await EstadoHabitacion.findOne({
    where: {
      codigo: 'DISPONIBLE',
      estado: true
    }
  });

  if (!estadoDisponible) {
    return {
      valido: false,
      mensaje: 'No existe el estado DISPONIBLE configurado'
    };
  }

  return {
    valido: true,
    estado: estadoDisponible
  };
}

function formatearImagen(imagen) {
  const data = imagen.toJSON ? imagen.toJSON() : imagen;

  return {
    id: data.id,
    habitacion_id: data.habitacion_id,
    imagen_url: data.imagen_url,
    descripcion: data.descripcion,
    principal: data.principal,
    fecha_creacion: data.fecha_creacion
  };
}

function formatearHabitacion(habitacion, imagenes = undefined) {
  const data = habitacion.toJSON();

  const estado = data.estado_habitacion || null;

  const habitacionFormateada = {
    id: data.id,
    numero: data.numero,
    tipo: data.tipo,
    descripcion: data.descripcion,
    capacidad_personas: data.capacidad_personas,
    estado: estado ? estado.nombre : null,
    fecha_creacion: data.fecha_creacion,
    fecha_actualizacion: data.fecha_actualizacion
  };

  if (imagenes !== undefined) {
    habitacionFormateada.imagenes = imagenes;
  }

  return habitacionFormateada;
}

async function obtenerHabitacionConEstado(id) {
  const habitacion = await Habitacion.findByPk(id, {
    include: [
      {
        model: EstadoHabitacion,
        as: 'estado_habitacion',
        attributes: [
          'id',
          'codigo',
          'nombre',
          'color',
          'permite_reservar'
        ]
      }
    ]
  });

  return habitacion;
}

async function crearHabitacion(req, res) {
  try {
    const {
      numero,
      tipo,
      descripcion,
      capacidad_personas,
      estado_id
    } = req.body;

    if (!numero || !tipo) {
      return res.status(400).json({
        mensaje: 'numero y tipo son obligatorios'
      });
    }

    const habitacionExiste = await Habitacion.findOne({
      where: { numero }
    });

    if (habitacionExiste) {
      return res.status(409).json({
        mensaje: 'Ya existe una habitación con ese número'
      });
    }

    const estadoValidado = await resolverEstadoHabitacionPorId(estado_id);

    if (!estadoValidado.valido) {
      return res.status(400).json({
        mensaje: estadoValidado.mensaje
      });
    }

    const habitacion = await Habitacion.create({
      numero,
      tipo,
      descripcion: descripcion || null,
      capacidad_personas: capacidad_personas || 1,
      estado_id: estadoValidado.estado.id,
      fecha_creacion: new Date(),
      fecha_actualizacion: null
    });

    const habitacionConEstado = await obtenerHabitacionConEstado(habitacion.id);

    return res.status(201).json({
      mensaje: 'Habitación creada correctamente',
      habitacion: formatearHabitacion(habitacionConEstado)
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al crear habitación'
    });
  }
}

async function listarHabitaciones(req, res) {
  try {
    const { habitacion_id } = req.query;

    const where = {};

    if (habitacion_id) {
      where.id = habitacion_id;
    }

    const habitaciones = await Habitacion.findAll({
      where,
      include: [
        {
          model: EstadoHabitacion,
          as: 'estado_habitacion',
          attributes: [
            'id',
            'codigo',
            'nombre',
            'color',
            'permite_reservar'
          ]
        }
      ],
      order: [['id', 'DESC']]
    });

    const idsHabitaciones = habitaciones.map((habitacion) => habitacion.id);

    let primeraImagenPorHabitacion = {};

    if (idsHabitaciones.length > 0) {
      const imagenes = await HabitacionImagen.findAll({
        where: {
          habitacion_id: {
            [Op.in]: idsHabitaciones
          }
        },
        order: [
          ['principal', 'DESC'],
          ['id', 'ASC']
        ]
      });

      for (const imagen of imagenes) {
        if (!primeraImagenPorHabitacion[imagen.habitacion_id]) {
          primeraImagenPorHabitacion[imagen.habitacion_id] = formatearImagen(imagen);
        }
      }
    }

    const habitacionesFormateadas = habitaciones.map((habitacion) => {
      const primeraImagen = primeraImagenPorHabitacion[habitacion.id];

      return formatearHabitacion(
        habitacion,
        primeraImagen ? [primeraImagen] : []
      );
    });

    return res.json({
      mensaje: 'Habitaciones obtenidas correctamente',
      habitaciones: habitacionesFormateadas
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al listar habitaciones'
    });
  }
}

async function editarHabitacion(req, res) {
  try {
    const { id } = req.params;

    const {
      numero,
      tipo,
      descripcion,
      capacidad_personas,
      estado_id
    } = req.body;

    const habitacion = await Habitacion.findByPk(id);

    if (!habitacion) {
      return res.status(404).json({
        mensaje: 'Habitación no encontrada'
      });
    }

    if (numero && numero !== habitacion.numero) {
      const habitacionExiste = await Habitacion.findOne({
        where: {
          numero,
          id: {
            [Op.ne]: id
          }
        }
      });

      if (habitacionExiste) {
        return res.status(409).json({
          mensaje: 'Ya existe otra habitación con ese número'
        });
      }

      habitacion.numero = numero;
    }

    if (tipo !== undefined) {
      habitacion.tipo = tipo;
    }

    if (descripcion !== undefined) {
      habitacion.descripcion = descripcion || null;
    }

    if (capacidad_personas !== undefined) {
      habitacion.capacidad_personas = capacidad_personas;
    }

    if (estado_id !== undefined) {
      const estadoValidado = await resolverEstadoHabitacionPorId(estado_id);

      if (!estadoValidado.valido) {
        return res.status(400).json({
          mensaje: estadoValidado.mensaje
        });
      }

      habitacion.estado_id = estadoValidado.estado.id;
    }

    habitacion.fecha_actualizacion = new Date();

    await habitacion.save();

    const habitacionActualizada = await obtenerHabitacionConEstado(id);

    return res.json({
      mensaje: 'Habitación actualizada correctamente',
      habitacion: formatearHabitacion(habitacionActualizada)
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al actualizar habitación'
    });
  }
}

async function eliminarHabitacion(req, res) {
  try {
    const { id } = req.params;

    const habitacion = await Habitacion.findByPk(id);

    if (!habitacion) {
      return res.status(404).json({
        mensaje: 'Habitación no encontrada'
      });
    }

    await habitacion.destroy();

    return res.json({
      mensaje: 'Habitación eliminada correctamente'
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al eliminar habitación. Puede que la habitación tenga reservaciones o imágenes asociadas.'
    });
  }
}

module.exports = {
  crearHabitacion,
  listarHabitaciones,
  editarHabitacion,
  eliminarHabitacion
};