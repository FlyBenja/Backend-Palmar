const express = require('express');
const router = express.Router();

const {
  listarEstadosHabitacion
} = require('./estadoHabitacionController');

/**
 * @swagger
 * /api/estados-habitacion:
 *   get:
 *     summary: Listar estados de habitación
 *     tags:
 *       - Estados de Habitación
 *     security: []
 *     responses:
 *       200:
 *         description: Estados obtenidos correctamente
 *       500:
 *         description: Error al listar estados
 */
router.get('/', listarEstadosHabitacion);

module.exports = router;