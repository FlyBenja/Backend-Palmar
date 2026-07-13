const express = require('express');
const router = express.Router();
const { verificarToken, autorizarRoles, ROLES } = require('../../../middlewares/authMiddleware');
const { listarCreditos, crearCredito, agregarCargoCredito, obtenerFacturaCredito, pagarCredito } = require('./creditoController');

router.get('/', verificarToken, autorizarRoles(ROLES.MANAGER, ROLES.EMPLEADO), listarCreditos);
router.post('/', verificarToken, autorizarRoles(ROLES.MANAGER, ROLES.EMPLEADO), crearCredito);
router.post('/:id/cargos', verificarToken, autorizarRoles(ROLES.MANAGER, ROLES.EMPLEADO), agregarCargoCredito);
router.get('/:id/factura', verificarToken, autorizarRoles(ROLES.MANAGER, ROLES.EMPLEADO), obtenerFacturaCredito);
router.patch('/:id/pagar', verificarToken, autorizarRoles(ROLES.MANAGER, ROLES.EMPLEADO), pagarCredito);

module.exports = router;
