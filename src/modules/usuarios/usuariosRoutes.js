const express = require('express');
const router = express.Router();

const {
  crearUsuario,
  editarCredencialesUsuario
} = require('./usuarioController');

const {
  verificarToken,
  autorizarRoles,
  ROLES
} = require('../../middlewares/authMiddleware');

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Crear usuario
 *     tags:
 *       - Usuarios
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rol_id
 *               - nombre
 *               - correo
 *               - contrasenia
 *             properties:
 *               rol_id:
 *                 type: integer
 *                 example: 1
 *               nombre:
 *                 type: string
 *                 example: "Manager Palmar"
 *               correo:
 *                 type: string
 *                 example: "manager@palmar.com"
 *               contrasenia:
 *                 type: string
 *                 example: "123456"
 *               telefono:
 *                 type: string
 *                 example: "55555555"
 *     responses:
 *       201:
 *         description: Usuario creado correctamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: El correo ya existe
 *       500:
 *         description: Error al crear usuario
 */
router.post('/', crearUsuario);

/**
 * @swagger
 * /api/usuarios/{id}/credenciales:
 *   patch:
 *     summary: Editar correo y contraseña de usuario
 *     tags:
 *       - Usuarios
 *     description: Permite editar el correo y/o contraseña de un usuario. Requiere token de Manager.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               correo:
 *                 type: string
 *                 example: "nuevo@palmar.com"
 *               contrasenia:
 *                 type: string
 *                 example: "12345678"
 *     responses:
 *       200:
 *         description: Credenciales actualizadas correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no enviado o inválido
 *       403:
 *         description: No tiene permisos
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: El correo ya está en uso
 *       500:
 *         description: Error al actualizar credenciales
 */
router.patch(
  '/:id/credenciales',
  verificarToken,
  autorizarRoles(ROLES.MANAGER),
  editarCredencialesUsuario
);

module.exports = router;