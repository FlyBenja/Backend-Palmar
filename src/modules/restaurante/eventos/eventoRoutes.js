const express = require('express');
const router = express.Router();
const { verificarToken, autorizarRoles, ROLES } = require('../../../middlewares/authMiddleware');
const { listarEventos, crearEvento, obtenerFacturaEvento, cerrarEvento } = require('./eventoController');

router.get('/', verificarToken, autorizarRoles(ROLES.MANAGER), listarEventos);
router.post('/', verificarToken, autorizarRoles(ROLES.MANAGER), crearEvento);
router.get('/:id/factura', verificarToken, autorizarRoles(ROLES.MANAGER), obtenerFacturaEvento);
router.patch('/:id/cerrar', verificarToken, autorizarRoles(ROLES.MANAGER), cerrarEvento);

module.exports = router;
