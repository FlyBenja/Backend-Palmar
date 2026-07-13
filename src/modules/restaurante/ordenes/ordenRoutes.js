const express = require('express');
const router = express.Router();

const {
  crearOrden,
  listarOrdenes,
  listarOrdenesCocinaHoy,
  actualizarEstadoOrden,
  actualizarEstadoDetalleCocina,
  cancelarOrden,
  listarMesasPendientesPago,
  obtenerFacturaMesa,
  pagarFacturaMesa,
  listarFacturasPendientesPago,
  obtenerFacturaRestaurantePendiente,
  pagarFacturaRestaurantePendiente,
  listarFacturasRestaurante
} = require('./ordenController');

const {
  verificarToken,
  autorizarRoles,
  ROLES
} = require('../../../middlewares/authMiddleware');

router.post(
  '/',
  verificarToken,
  autorizarRoles(ROLES.MANAGER, ROLES.EMPLEADO),
  crearOrden
);

router.get(
  '/',
  verificarToken,
  autorizarRoles(ROLES.MANAGER, ROLES.EMPLEADO),
  listarOrdenes
);


router.get(
  '/mesas/pendientes',
  verificarToken,
  autorizarRoles(ROLES.MANAGER, ROLES.EMPLEADO),
  listarMesasPendientesPago
);

router.get(
  '/mesas/:numeroMesa/factura',
  verificarToken,
  autorizarRoles(ROLES.MANAGER, ROLES.EMPLEADO),
  obtenerFacturaMesa
);

router.patch(
  '/mesas/:numeroMesa/pagar',
  verificarToken,
  autorizarRoles(ROLES.MANAGER, ROLES.EMPLEADO),
  pagarFacturaMesa
);


router.get(
  '/facturas/pendientes',
  verificarToken,
  autorizarRoles(ROLES.MANAGER, ROLES.EMPLEADO),
  listarFacturasPendientesPago
);

router.get(
  '/facturas/:clave',
  verificarToken,
  autorizarRoles(ROLES.MANAGER, ROLES.EMPLEADO),
  obtenerFacturaRestaurantePendiente
);

router.patch(
  '/facturas/:clave/pagar',
  verificarToken,
  autorizarRoles(ROLES.MANAGER, ROLES.EMPLEADO),
  pagarFacturaRestaurantePendiente
);

router.get(
  '/facturas',
  verificarToken,
  autorizarRoles(ROLES.MANAGER),
  listarFacturasRestaurante
);

router.get(
  '/cocina/hoy',
  verificarToken,
  autorizarRoles(ROLES.COCINA),
  listarOrdenesCocinaHoy
);


router.patch(
  '/:id/cancelar',
  verificarToken,
  autorizarRoles(ROLES.MANAGER, ROLES.EMPLEADO, ROLES.COCINA),
  cancelarOrden
);

router.patch(
  '/:id/estado',
  verificarToken,
  autorizarRoles(ROLES.MANAGER, ROLES.EMPLEADO, ROLES.COCINA),
  actualizarEstadoOrden
);

router.patch(
  '/detalles/:detalleId/estado-cocina',
  verificarToken,
  autorizarRoles(ROLES.COCINA),
  actualizarEstadoDetalleCocina
);

module.exports = router;
