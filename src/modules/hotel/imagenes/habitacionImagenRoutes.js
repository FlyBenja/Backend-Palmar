const express = require('express');
const router = express.Router();

const uploadHabitacion = require('../../../middlewares/uploadHabitacion');

const {
  subirImagenHabitacion,
  listarImagenesPorHabitacion,
  editarImagenHabitacion,
  eliminarImagenHabitacion
} = require('./habitacionImagenController');

const {
  verificarToken,
  autorizarRoles,
  ROLES
} = require('../../../middlewares/authMiddleware');

/**
 * @swagger
 * /api/habitaciones/{habitacionId}/imagenes:
 *   post:
 *     summary: Subir imagen de habitación
 *     tags:
 *       - Habitaciones - Imágenes
 *     parameters:
 *       - in: path
 *         name: habitacionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la habitación
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - imagen
 *             properties:
 *               imagen:
 *                 type: string
 *                 format: binary
 *               descripcion:
 *                 type: string
 *                 example: "Imagen principal"
 *               principal:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Imagen subida correctamente
 *       401:
 *         description: Token no enviado o inválido
 *       403:
 *         description: No tiene permisos
 */
router.post(
  '/:habitacionId/imagenes',
  verificarToken,
  autorizarRoles(ROLES.MANAGER),
  uploadHabitacion.single('imagen'),
  subirImagenHabitacion
);

/**
 * @swagger
 * /api/habitaciones/{habitacionId}/imagenes:
 *   get:
 *     summary: Listar imágenes por habitación
 *     tags:
 *       - Habitaciones - Imágenes
 *     security: []
 *     parameters:
 *       - in: path
 *         name: habitacionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la habitación
 *         example: 1
 *     responses:
 *       200:
 *         description: Imágenes obtenidas correctamente
 *       404:
 *         description: Habitación no encontrada
 *       500:
 *         description: Error al listar imágenes
 */
router.get(
  '/:habitacionId/imagenes',
  listarImagenesPorHabitacion
);

/**
 * @swagger
 * /api/habitaciones/imagenes/{imagenId}:
 *   patch:
 *     summary: Editar imagen de habitación
 *     tags:
 *       - Habitaciones - Imágenes
 *     parameters:
 *       - in: path
 *         name: imagenId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la imagen
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               imagen:
 *                 type: string
 *                 format: binary
 *               descripcion:
 *                 type: string
 *                 example: "Imagen actualizada"
 *               principal:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Imagen actualizada correctamente
 *       401:
 *         description: Token no enviado o inválido
 *       403:
 *         description: No tiene permisos
 */
router.patch(
  '/imagenes/:imagenId',
  verificarToken,
  autorizarRoles(ROLES.MANAGER),
  uploadHabitacion.single('imagen'),
  editarImagenHabitacion
);

/**
 * @swagger
 * /api/habitaciones/imagenes/{imagenId}:
 *   delete:
 *     summary: Eliminar imagen de habitación
 *     tags:
 *       - Habitaciones - Imágenes
 *     parameters:
 *       - in: path
 *         name: imagenId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la imagen
 *         example: 1
 *     responses:
 *       200:
 *         description: Imagen eliminada correctamente
 *       401:
 *         description: Token no enviado o inválido
 *       403:
 *         description: No tiene permisos
 */
router.delete(
  '/imagenes/:imagenId',
  verificarToken,
  autorizarRoles(ROLES.MANAGER),
  eliminarImagenHabitacion
);

module.exports = router;