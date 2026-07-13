const express = require('express');
const router = express.Router();

const uploadMenu = require('../../../middlewares/uploadMenu');

const {
  listarCategoriasMenu,
  crearCategoriaMenu,
  editarCategoriaMenu,
  eliminarCategoriaMenu,
  reordenarCategoriasMenu,
  listarMenuItems,
  crearMenuItem,
  editarMenuItem
} = require('./menuController');

const {
  verificarToken,
  autorizarRoles,
  ROLES
} = require('../../../middlewares/authMiddleware');

router.get(
  '/categorias',
  verificarToken,
  autorizarRoles(ROLES.MANAGER, ROLES.EMPLEADO),
  listarCategoriasMenu
);

router.post(
  '/categorias',
  verificarToken,
  autorizarRoles(ROLES.MANAGER),
  crearCategoriaMenu
);

router.patch(
  '/categorias/orden',
  verificarToken,
  autorizarRoles(ROLES.MANAGER),
  reordenarCategoriasMenu
);

router.patch(
  '/categorias/:id',
  verificarToken,
  autorizarRoles(ROLES.MANAGER),
  editarCategoriaMenu
);

router.delete(
  '/categorias/:id',
  verificarToken,
  autorizarRoles(ROLES.MANAGER),
  eliminarCategoriaMenu
);

router.get(
  '/items',
  verificarToken,
  autorizarRoles(ROLES.MANAGER, ROLES.EMPLEADO),
  listarMenuItems
);

router.post(
  '/items',
  verificarToken,
  autorizarRoles(ROLES.MANAGER),
  uploadMenu.single('imagen'),
  crearMenuItem
);

router.patch(
  '/items/:id',
  verificarToken,
  autorizarRoles(ROLES.MANAGER),
  uploadMenu.single('imagen'),
  editarMenuItem
);

module.exports = router;
