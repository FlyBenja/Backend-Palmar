const Habitacion = require('../../../models/Habitacion');
const HabitacionImagen = require('../../../models/HabitacionImagen');

const { convertirBooleano } = require('../../../utils/booleanUtils');
const { eliminarArchivoPorUrl } = require('../../../utils/fileUtils');

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

async function subirImagenHabitacion(req, res) {
  try {
    const { habitacionId } = req.params;

    const {
      descripcion,
      principal
    } = req.body;

    const habitacion = await Habitacion.findByPk(habitacionId);

    if (!habitacion) {
      return res.status(404).json({
        mensaje: 'Habitación no encontrada'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        mensaje: 'Debe enviar una imagen'
      });
    }

    const imagenUrl = `/uploads/habitaciones/${req.file.filename}`;

    const cantidadImagenes = await HabitacionImagen.count({
      where: {
        habitacion_id: habitacionId
      }
    });

    const esPrincipal = cantidadImagenes === 0
      ? true
      : convertirBooleano(principal);

    if (esPrincipal) {
      await HabitacionImagen.update(
        {
          principal: false
        },
        {
          where: {
            habitacion_id: habitacionId
          }
        }
      );
    }

    const imagen = await HabitacionImagen.create({
      habitacion_id: habitacionId,
      imagen_url: imagenUrl,
      descripcion: descripcion || null,
      principal: esPrincipal,
      fecha_creacion: new Date()
    });

    return res.status(201).json({
      mensaje: 'Imagen subida correctamente',
      imagen: formatearImagen(imagen)
    });
  } catch (error) {
    console.error(error);

    if (req.file) {
      eliminarArchivoPorUrl(`/uploads/habitaciones/${req.file.filename}`);
    }

    return res.status(500).json({
      mensaje: 'Error al subir imagen'
    });
  }
}

async function listarImagenesPorHabitacion(req, res) {
  try {
    const { habitacionId } = req.params;

    const habitacion = await Habitacion.findByPk(habitacionId);

    if (!habitacion) {
      return res.status(404).json({
        mensaje: 'Habitación no encontrada'
      });
    }

    const imagenes = await HabitacionImagen.findAll({
      where: {
        habitacion_id: habitacionId
      },
      order: [
        ['principal', 'DESC'],
        ['id', 'DESC']
      ]
    });

    return res.json({
      mensaje: 'Imágenes obtenidas correctamente',
      imagenes: imagenes.map(formatearImagen)
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al listar imágenes'
    });
  }
}

async function editarImagenHabitacion(req, res) {
  try {
    const { imagenId } = req.params;

    const {
      descripcion,
      principal
    } = req.body;

    const imagen = await HabitacionImagen.findByPk(imagenId);

    if (!imagen) {
      return res.status(404).json({
        mensaje: 'Imagen no encontrada'
      });
    }

    if (descripcion !== undefined) {
      imagen.descripcion = descripcion || null;
    }

    if (principal !== undefined) {
      const esPrincipal = convertirBooleano(principal);

      if (esPrincipal) {
        await HabitacionImagen.update(
          {
            principal: false
          },
          {
            where: {
              habitacion_id: imagen.habitacion_id
            }
          }
        );
      }

      imagen.principal = esPrincipal;
    }

    if (req.file) {
      eliminarArchivoPorUrl(imagen.imagen_url);
      imagen.imagen_url = `/uploads/habitaciones/${req.file.filename}`;
    }

    await imagen.save();

    return res.json({
      mensaje: 'Imagen actualizada correctamente',
      imagen: formatearImagen(imagen)
    });
  } catch (error) {
    console.error(error);

    if (req.file) {
      eliminarArchivoPorUrl(`/uploads/habitaciones/${req.file.filename}`);
    }

    return res.status(500).json({
      mensaje: 'Error al actualizar imagen'
    });
  }
}

async function eliminarImagenHabitacion(req, res) {
  try {
    const { imagenId } = req.params;

    const imagen = await HabitacionImagen.findByPk(imagenId);

    if (!imagen) {
      return res.status(404).json({
        mensaje: 'Imagen no encontrada'
      });
    }

    eliminarArchivoPorUrl(imagen.imagen_url);

    await imagen.destroy();

    return res.json({
      mensaje: 'Imagen eliminada correctamente'
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al eliminar imagen'
    });
  }
}

module.exports = {
  subirImagenHabitacion,
  listarImagenesPorHabitacion,
  editarImagenHabitacion,
  eliminarImagenHabitacion
};