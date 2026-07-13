const express = require('express');
const router = express.Router();

const {
  listarCategoriasInventario,
  crearCategoriaInventario,
  editarCategoriaInventario,
  listarProductosInventario,
  crearProductoInventario,
  editarProductoInventario,
  crearMovimientoInventario,
  listarMovimientosInventario
} = require('./inventarioController');

const {
  verificarToken,
  autorizarRoles,
  ROLES
} = require('../../../middlewares/authMiddleware');

router.use(verificarToken, autorizarRoles(ROLES.MANAGER));

router.get('/categorias', listarCategoriasInventario);
router.post('/categorias', crearCategoriaInventario);
router.patch('/categorias/:id', editarCategoriaInventario);

router.get('/productos', listarProductosInventario);
router.post('/productos', crearProductoInventario);
router.patch('/productos/:id', editarProductoInventario);

router.get('/movimientos', listarMovimientosInventario);
router.post('/movimientos', crearMovimientoInventario);

module.exports = router;
