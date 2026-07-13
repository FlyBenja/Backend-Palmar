const express = require('express');
const router = express.Router();

const {
  reporteFinancieroDia,
  reporteFinancieroSemana,
  reporteFinancieroMes
} = require('./reporteFinancieroController');

const {
  verificarToken,
  autorizarRoles,
  ROLES
} = require('../../../middlewares/authMiddleware');

router.use(verificarToken, autorizarRoles(ROLES.MANAGER));

router.get('/financiero/dia', reporteFinancieroDia);
router.get('/financiero/semana', reporteFinancieroSemana);
router.get('/financiero/mes', reporteFinancieroMes);

module.exports = router;
