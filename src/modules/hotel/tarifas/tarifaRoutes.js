const express = require('express');
const router = express.Router();

const {
  crearTarifa,
  listarTarifas,
  editarTarifa,
  eliminarTarifa
} = require('./tarifaController');

const {
  verificarToken,
  autorizarRoles,
  ROLES
} = require('../../../middlewares/authMiddleware');

/**
 * @swagger
 * /api/tarifas:
 *   post:
 *     summary: Crear tarifa
 *     tags:
 *       - Tarifas
 *     description: Crea una tarifa para usarla al crear reservaciones.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - precio
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Tarifa estándar"
 *               descripcion:
 *                 type: string
 *                 example: "Tarifa normal por noche"
 *               precio:
 *                 type: number
 *                 example: 350
 *     responses:
 *       201:
 *         description: Tarifa creada correctamente
 *       401:
 *         description: Token no enviado o inválido
 *       403:
 *         description: No tiene permisos
 */
router.post(
  '/',
  verificarToken,
  autorizarRoles(ROLES.MANAGER),
  crearTarifa
);

/**
 * @swagger
 * /api/tarifas:
 *   get:
 *     summary: Listar tarifas
 *     tags:
 *       - Tarifas
 *     security: []
 *     description: Lista todas las tarifas registradas.
 *     responses:
 *       200:
 *         description: Tarifas obtenidas correctamente
 *       500:
 *         description: Error al listar tarifas
 */
router.get('/', listarTarifas);

/**
 * @swagger
 * /api/tarifas/{id}:
 *   patch:
 *     summary: Editar tarifa
 *     tags:
 *       - Tarifas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la tarifa
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Tarifa doble"
 *               descripcion:
 *                 type: string
 *                 example: "Tarifa para habitación doble"
 *               precio:
 *                 type: number
 *                 example: 500
 *     responses:
 *       200:
 *         description: Tarifa actualizada correctamente
 *       401:
 *         description: Token no enviado o inválido
 *       403:
 *         description: No tiene permisos
 */
router.patch(
  '/:id',
  verificarToken,
  autorizarRoles(ROLES.MANAGER),
  editarTarifa
);

/**
 * @swagger
 * /api/tarifas/{id}:
 *   delete:
 *     summary: Eliminar tarifa
 *     tags:
 *       - Tarifas
 *     description: Elimina físicamente una tarifa. Si está asociada a una reservación, no se podrá eliminar.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la tarifa
 *         example: 1
 *     responses:
 *       200:
 *         description: Tarifa eliminada correctamente
 *       401:
 *         description: Token no enviado o inválido
 *       403:
 *         description: No tiene permisos
 */
router.delete(
  '/:id',
  verificarToken,
  autorizarRoles(ROLES.MANAGER),
  eliminarTarifa
);

module.exports = router;