const express = require('express');
const router = express.Router();

const {
  crearReservacion,
  listarReservaciones,
  obtenerFacturaReservacion,
  pagarReservacion,
  registrarSalidaAnticipada
} = require('./reservacionController');

const {
  verificarToken,
  autorizarRoles,
  ROLES
} = require('../../../middlewares/authMiddleware');

/**
 * @swagger
 * /api/reservaciones:
 *   post:
 *     summary: Crear reservación
 *     tags:
 *       - Reservaciones
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - habitacion_id
 *               - tarifa_id
 *               - nombre_cliente
 *               - fecha_entrada
 *               - dias
 *             properties:
 *               habitacion_id:
 *                 type: integer
 *                 example: 1
 *               tarifa_id:
 *                 type: integer
 *                 example: 1
 *               nombre_cliente:
 *                 type: string
 *                 example: "Juan Pérez"
 *               nit:
 *                 type: string
 *                 example: "1234567-8"
 *               fecha_entrada:
 *                 type: string
 *                 format: date
 *                 example: "2026-06-22"
 *               dias:
 *                 type: integer
 *                 example: 2
 *               cantidad_personas:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Reservación creada correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no enviado o inválido
 *       403:
 *         description: No tiene permisos
 *       404:
 *         description: Habitación o tarifa no encontrada
 *       409:
 *         description: Reservación traslapada o habitación no disponible
 *       500:
 *         description: Error al crear reservación
 */
router.post(
  '/',
  verificarToken,
  autorizarRoles(ROLES.MANAGER, ROLES.EMPLEADO),
  crearReservacion
);

/**
 * @swagger
 * /api/reservaciones:
 *   get:
 *     summary: Listar reservaciones
 *     tags:
 *       - Reservaciones
 *     parameters:
 *       - in: query
 *         name: habitacion_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtrar por habitación
 *         example: 1
 *       - in: query
 *         name: estado_reservacion_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtrar por estado de reservación
 *         example: 1
 *     responses:
 *       200:
 *         description: Reservaciones obtenidas correctamente
 *       401:
 *         description: Token no enviado o inválido
 *       403:
 *         description: No tiene permisos
 *       500:
 *         description: Error al listar reservaciones
 */
router.get(
  '/',
  verificarToken,
  autorizarRoles(ROLES.MANAGER, ROLES.EMPLEADO),
  listarReservaciones
);


/**
 * @swagger
 * /api/reservaciones/{id}/factura:
 *   get:
 *     summary: Obtener factura de reservación
 *     tags:
 *       - Reservaciones
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la reservación
 *         example: 1
 *     responses:
 *       200:
 *         description: Factura de reservación obtenida correctamente
 *       401:
 *         description: Token no enviado o inválido
 *       403:
 *         description: No tiene permisos
 *       404:
 *         description: Reservación no encontrada
 *       500:
 *         description: Error al obtener factura de reservación
 */
router.get(
  '/:id/factura',
  verificarToken,
  autorizarRoles(ROLES.MANAGER, ROLES.EMPLEADO),
  obtenerFacturaReservacion
);

/**
 * @swagger
 * /api/reservaciones/{id}/pagar:
 *   patch:
 *     summary: Pagar reservación
 *     tags:
 *       - Reservaciones
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la reservación
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo_pago_id
 *             properties:
 *               precio_pagado:
 *                 type: number
 *                 description: Opcional. Si no se envía, el backend usa el total de la factura.
 *                 example: 700
 *               tipo_pago_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Reservación pagada correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no enviado o inválido
 *       403:
 *         description: No tiene permisos
 *       404:
 *         description: Reservación o tipo de pago no encontrado
 *       500:
 *         description: Error al pagar reservación
 */

router.patch(
  '/:id/salida-anticipada',
  verificarToken,
  autorizarRoles(ROLES.MANAGER, ROLES.EMPLEADO),
  registrarSalidaAnticipada
);

router.patch(
  '/:id/pagar',
  verificarToken,
  autorizarRoles(ROLES.MANAGER, ROLES.EMPLEADO),
  pagarReservacion
);

module.exports = router;