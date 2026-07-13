const express = require('express');
const router = express.Router();

const {
  crearHabitacion,
  listarHabitaciones,
  editarHabitacion,
  eliminarHabitacion
} = require('./habitacionController');

const {
  verificarToken,
  autorizarRoles,
  ROLES
} = require('../../../middlewares/authMiddleware');

/**
 * @swagger
 * /api/habitaciones:
 *   post:
 *     summary: Crear habitación
 *     tags:
 *       - Habitaciones
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numero
 *               - tipo
 *             properties:
 *               numero:
 *                 type: string
 *                 example: "101"
 *               tipo:
 *                 type: string
 *                 example: "Doble"
 *               descripcion:
 *                 type: string
 *                 example: "Habitación doble con aire acondicionado"
 *               capacidad_personas:
 *                 type: integer
 *                 example: 2
 *               estado_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Habitación creada correctamente
 *       401:
 *         description: Token no enviado o inválido
 *       403:
 *         description: No tiene permisos
 */
router.post(
  '/',
  verificarToken,
  autorizarRoles(ROLES.MANAGER),
  crearHabitacion
);

/**
 * @swagger
 * /api/habitaciones:
 *   get:
 *     summary: Listar habitaciones
 *     tags:
 *       - Habitaciones
 *     security: []
 *     parameters:
 *       - in: query
 *         name: habitacion_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de habitación
 *         example: 1
 *     responses:
 *       200:
 *         description: Habitaciones obtenidas correctamente
 *       500:
 *         description: Error al listar habitaciones
 */
router.get('/', listarHabitaciones);

/**
 * @swagger
 * /api/habitaciones/{id}:
 *   patch:
 *     summary: Editar habitación
 *     tags:
 *       - Habitaciones
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la habitación
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numero:
 *                 type: string
 *                 example: "102"
 *               tipo:
 *                 type: string
 *                 example: "Suite"
 *               descripcion:
 *                 type: string
 *                 example: "Suite con baño privado"
 *               capacidad_personas:
 *                 type: integer
 *                 example: 4
 *               estado_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Habitación actualizada correctamente
 *       401:
 *         description: Token no enviado o inválido
 *       403:
 *         description: No tiene permisos
 */
router.patch(
  '/:id',
  verificarToken,
  autorizarRoles(ROLES.MANAGER),
  editarHabitacion
);

/**
 * @swagger
 * /api/habitaciones/{id}:
 *   delete:
 *     summary: Eliminar habitación
 *     tags:
 *       - Habitaciones
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la habitación
 *         example: 1
 *     responses:
 *       200:
 *         description: Habitación eliminada correctamente
 *       401:
 *         description: Token no enviado o inválido
 *       403:
 *         description: No tiene permisos
 */
router.delete(
  '/:id',
  verificarToken,
  autorizarRoles(ROLES.MANAGER),
  eliminarHabitacion
);

module.exports = router;