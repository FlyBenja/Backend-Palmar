const EstadoHabitacion = require('../../../models/EstadoHabitacion');

async function listarEstadosHabitacion(req, res) {
  try {
    const estados = await EstadoHabitacion.findAll({
      where: {
        estado: true
      },
      order: [['id', 'ASC']]
    });

    return res.json({
      mensaje: 'Estados de habitación obtenidos correctamente',
      estados
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al listar estados de habitación'
    });
  }
}

module.exports = {
  listarEstadosHabitacion
};