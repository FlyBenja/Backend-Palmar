const { Op } = require('sequelize');

const CategoriaMenu = require('../../../models/CategoriaMenu');
const MenuItem = require('../../../models/MenuItem');
const MenuItemIngrediente = require('../../../models/MenuItemIngrediente');
const ProductoInventario = require('../../../models/ProductoInventario');
const { eliminarArchivoPorUrl } = require('../../../utils/fileUtils');


function parsearBooleano(valor, valorDefecto = true) {
  if (valor === undefined || valor === null || valor === '') {
    return valorDefecto;
  }

  if (typeof valor === 'boolean') {
    return valor;
  }

  return String(valor).toLowerCase() === 'true' || String(valor) === '1';
}

function parsearIngredientes(valor) {
  if (!valor) {
    return [];
  }

  if (Array.isArray(valor)) {
    return valor;
  }

  try {
    const ingredientes = JSON.parse(valor);
    return Array.isArray(ingredientes) ? ingredientes : [];
  } catch (error) {
    return [];
  }
}

async function guardarIngredientesMenu(menuItemId, ingredientes) {
  for (const ingrediente of ingredientes) {
    const productoId = Number(ingrediente.producto_inventario_id);
    const cantidadRequerida = Number(ingrediente.cantidad_requerida);

    if (!productoId || !cantidadRequerida || cantidadRequerida <= 0) {
      continue;
    }

    const producto = await ProductoInventario.findOne({
      where: {
        id: productoId,
        estado: true
      }
    });

    if (!producto) {
      continue;
    }

    await MenuItemIngrediente.create({
      menu_item_id: menuItemId,
      producto_inventario_id: productoId,
      cantidad_requerida: cantidadRequerida,
      fecha_creacion: new Date(),
      fecha_actualizacion: null
    });
  }
}

function formatearCategoriaMenu(categoria) {
  const data = categoria.toJSON ? categoria.toJSON() : categoria;

  return {
    id: data.id,
    nombre: data.nombre,
    descripcion: data.descripcion,
    estado: data.estado,
    orden: data.orden || 0,
    fecha_creacion: data.fecha_creacion,
    fecha_actualizacion: data.fecha_actualizacion
  };
}

async function formatearIngrediente(ingrediente) {
  const data = ingrediente.toJSON ? ingrediente.toJSON() : ingrediente;
  const producto = await ProductoInventario.findByPk(data.producto_inventario_id);

  return {
    id: data.id,
    menu_item_id: data.menu_item_id,
    producto_inventario_id: data.producto_inventario_id,
    producto: producto
      ? {
          id: producto.id,
          nombre: producto.nombre,
          unidad_medida: producto.unidad_medida,
          stock_actual: producto.stock_actual,
          stock_minimo: producto.stock_minimo,
          costo_unitario: producto.costo_unitario
        }
      : null,
    cantidad_requerida: data.cantidad_requerida,
    fecha_creacion: data.fecha_creacion,
    fecha_actualizacion: data.fecha_actualizacion
  };
}

async function formatearMenuItem(item, incluirIngredientes = true) {
  const data = item.toJSON ? item.toJSON() : item;
  const categoria = await CategoriaMenu.findByPk(data.categoria_menu_id);

  const formateado = {
    id: data.id,
    categoria_menu_id: data.categoria_menu_id,
    categoria: categoria ? formatearCategoriaMenu(categoria) : null,
    nombre: data.nombre,
    descripcion: data.descripcion,
    precio: data.precio,
    tipo: data.tipo,
    disponible: data.disponible,
    imagen_url: data.imagen_url,
    estado: data.estado,
    orden: data.orden || 0,
    fecha_creacion: data.fecha_creacion,
    fecha_actualizacion: data.fecha_actualizacion
  };

  if (incluirIngredientes) {
    const ingredientes = await MenuItemIngrediente.findAll({
      where: {
        menu_item_id: data.id
      },
      order: [['id', 'ASC']]
    });

    formateado.ingredientes = await Promise.all(ingredientes.map(formatearIngrediente));
  }

  return formateado;
}

async function listarCategoriasMenu(req, res) {
  try {
    const categorias = await CategoriaMenu.findAll({
      where: {
        estado: true
      },
      order: [['orden', 'ASC'], ['id', 'ASC']]
    });

    return res.json({
      mensaje: 'Categorías de menú obtenidas correctamente',
      categorias: categorias.map(formatearCategoriaMenu)
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al listar categorías de menú'
    });
  }
}

async function crearCategoriaMenu(req, res) {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({
        mensaje: 'nombre es obligatorio'
      });
    }

    const existe = await CategoriaMenu.findOne({ where: { nombre } });

    if (existe) {
      return res.status(409).json({
        mensaje: 'Ya existe una categoría de menú con ese nombre'
      });
    }

    const ultimaCategoria = await CategoriaMenu.findOne({ order: [['orden', 'DESC'], ['id', 'DESC']] });
    const categoria = await CategoriaMenu.create({
      nombre,
      descripcion: descripcion || null,
      estado: true,
      orden: ultimaCategoria ? Number(ultimaCategoria.orden || 0) + 1 : 1,
      fecha_creacion: new Date(),
      fecha_actualizacion: null
    });

    return res.status(201).json({
      mensaje: 'Categoría de menú creada correctamente',
      categoria: formatearCategoriaMenu(categoria)
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al crear categoría de menú'
    });
  }
}

async function editarCategoriaMenu(req, res) {
  try {
    const { id } = req.params;
    const { nombre, descripcion, estado, orden } = req.body;

    const categoria = await CategoriaMenu.findByPk(id);

    if (!categoria) {
      return res.status(404).json({
        mensaje: 'Categoría de menú no encontrada'
      });
    }

    if (nombre !== undefined) {
      const existe = await CategoriaMenu.findOne({
        where: {
          nombre,
          id: { [Op.ne]: id }
        }
      });

      if (existe) {
        return res.status(409).json({
          mensaje: 'Ya existe una categoría de menú con ese nombre'
        });
      }

      categoria.nombre = nombre;
    }

    if (descripcion !== undefined) categoria.descripcion = descripcion || null;
    if (estado !== undefined) categoria.estado = parsearBooleano(estado, categoria.estado);
    if (orden !== undefined) categoria.orden = Number(orden) || 0;

    categoria.fecha_actualizacion = new Date();

    await categoria.save();

    return res.json({
      mensaje: 'Categoría de menú actualizada correctamente',
      categoria: formatearCategoriaMenu(categoria)
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al actualizar categoría de menú'
    });
  }
}


async function eliminarCategoriaMenu(req, res) {
  try {
    const { id } = req.params;
    const categoria = await CategoriaMenu.findByPk(id);

    if (!categoria) {
      return res.status(404).json({ mensaje: 'Categoría de menú no encontrada' });
    }

    categoria.estado = false;
    categoria.fecha_actualizacion = new Date();
    await categoria.save();

    await MenuItem.update(
      { estado: false, disponible: false, fecha_actualizacion: new Date() },
      { where: { categoria_menu_id: categoria.id } }
    );

    return res.json({
      mensaje: 'Categoría de menú eliminada correctamente',
      categoria: formatearCategoriaMenu(categoria)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: 'Error al eliminar categoría de menú' });
  }
}

async function reordenarCategoriasMenu(req, res) {
  try {
    const categorias = Array.isArray(req.body.categorias) ? req.body.categorias : [];

    for (const item of categorias) {
      const id = Number(item.id);
      const orden = Number(item.orden);

      if (!id || !orden) continue;

      await CategoriaMenu.update(
        { orden, fecha_actualizacion: new Date() },
        { where: { id } }
      );
    }

    const categoriasActualizadas = await CategoriaMenu.findAll({
      where: { estado: true },
      order: [['orden', 'ASC'], ['id', 'ASC']]
    });

    return res.json({
      mensaje: 'Orden de categorías actualizado correctamente',
      categorias: categoriasActualizadas.map(formatearCategoriaMenu)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: 'Error al ordenar categorías de menú' });
  }
}

async function listarMenuItems(req, res) {
  try {
    const {
      categoria_menu_id,
      disponible,
      tipo
    } = req.query;

    const where = {
      estado: true
    };

    if (categoria_menu_id) where.categoria_menu_id = categoria_menu_id;
    if (tipo) where.tipo = tipo;
    if (disponible !== undefined) where.disponible = disponible === 'true';

    const incluirIngredientes = req.query.incluir_ingredientes === 'true';

    const categorias = await CategoriaMenu.findAll({
      where: { estado: true },
      order: [['orden', 'ASC'], ['id', 'ASC']]
    });

    const ordenPorCategoria = categorias.reduce((mapa, categoria, index) => {
      mapa[categoria.id] = Number(categoria.orden || index + 1);
      return mapa;
    }, {});

    const items = await MenuItem.findAll({
      where,
      order: [['nombre', 'ASC'], ['id', 'ASC']]
    });

    const itemsOrdenados = items.sort((a, b) => {
      const ordenA = ordenPorCategoria[a.categoria_menu_id] || 999999;
      const ordenB = ordenPorCategoria[b.categoria_menu_id] || 999999;

      if (ordenA !== ordenB) return ordenA - ordenB;

      return String(a.nombre || '').localeCompare(String(b.nombre || ''));
    });

    return res.json({
      mensaje: 'Menú obtenido correctamente',
      items: await Promise.all(itemsOrdenados.map((item) => formatearMenuItem(item, incluirIngredientes)))
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al listar menú'
    });
  }
}

async function crearMenuItem(req, res) {
  try {
    const {
      categoria_menu_id,
      nombre,
      descripcion,
      precio,
      tipo,
      disponible,
      imagen_url
    } = req.body;

    const ingredientes = parsearIngredientes(req.body.ingredientes);

    if (!categoria_menu_id || !nombre || precio === undefined || precio === null || precio === '') {
      return res.status(400).json({
        mensaje: 'categoria_menu_id, nombre y precio son obligatorios'
      });
    }

    const categoria = await CategoriaMenu.findOne({
      where: {
        id: categoria_menu_id,
        estado: true
      }
    });

    if (!categoria) {
      return res.status(404).json({
        mensaje: 'Categoría de menú no encontrada o inactiva'
      });
    }

    if (Number(precio) < 0) {
      return res.status(400).json({
        mensaje: 'precio no puede ser negativo'
      });
    }

    const imagenFinal = req.file
      ? `/uploads/menu/${req.file.filename}`
      : (imagen_url || null);

    const item = await MenuItem.create({
      categoria_menu_id,
      nombre,
      descripcion: descripcion || null,
      precio,
      tipo: tipo || 'COMIDA',
      disponible: parsearBooleano(disponible, true),
      imagen_url: imagenFinal,
      estado: true,
      fecha_creacion: new Date(),
      fecha_actualizacion: null
    });

    await guardarIngredientesMenu(item.id, ingredientes);

    return res.status(201).json({
      mensaje: 'Producto de menú creado correctamente',
      item: await formatearMenuItem(item)
    });
  } catch (error) {
    console.error(error);

    if (req.file) {
      eliminarArchivoPorUrl(`/uploads/menu/${req.file.filename}`);
    }

    return res.status(500).json({
      mensaje: 'Error al crear producto de menú'
    });
  }
}
async function editarMenuItem(req, res) {
  try {
    const { id } = req.params;
    const {
      categoria_menu_id,
      nombre,
      descripcion,
      precio,
      tipo,
      disponible,
      imagen_url,
      estado
    } = req.body;

    const ingredientes = parsearIngredientes(req.body.ingredientes);
    const debeActualizarIngredientes = req.body.ingredientes !== undefined;

    const item = await MenuItem.findByPk(id);

    if (!item) {
      return res.status(404).json({
        mensaje: 'Producto de menú no encontrado'
      });
    }

    if (categoria_menu_id !== undefined) {
      const categoria = await CategoriaMenu.findOne({
        where: {
          id: categoria_menu_id,
          estado: true
        }
      });

      if (!categoria) {
        return res.status(404).json({
          mensaje: 'Categoría de menú no encontrada o inactiva'
        });
      }

      item.categoria_menu_id = categoria_menu_id;
    }

    if (nombre !== undefined) item.nombre = nombre;
    if (descripcion !== undefined) item.descripcion = descripcion || null;
    if (precio !== undefined) {
      if (Number(precio) < 0) {
        return res.status(400).json({ mensaje: 'precio no puede ser negativo' });
      }

      item.precio = precio;
    }
    if (tipo !== undefined) item.tipo = tipo || 'COMIDA';
    if (disponible !== undefined) item.disponible = parsearBooleano(disponible, true);
    if (imagen_url !== undefined) item.imagen_url = imagen_url || null;
    if (estado !== undefined) item.estado = parsearBooleano(estado, true);

    if (req.file) {
      if (item.imagen_url) {
        eliminarArchivoPorUrl(item.imagen_url);
      }

      item.imagen_url = `/uploads/menu/${req.file.filename}`;
    }

    item.fecha_actualizacion = new Date();

    await item.save();

    if (debeActualizarIngredientes) {
      await MenuItemIngrediente.destroy({
        where: {
          menu_item_id: item.id
        }
      });

      await guardarIngredientesMenu(item.id, ingredientes);
    }

    return res.json({
      mensaje: 'Producto de menú actualizado correctamente',
      item: await formatearMenuItem(item)
    });
  } catch (error) {
    console.error(error);

    if (req.file) {
      eliminarArchivoPorUrl(`/uploads/menu/${req.file.filename}`);
    }

    return res.status(500).json({
      mensaje: 'Error al actualizar producto de menú'
    });
  }
}
module.exports = {
  listarCategoriasMenu,
  crearCategoriaMenu,
  editarCategoriaMenu,
  eliminarCategoriaMenu,
  reordenarCategoriasMenu,
  listarMenuItems,
  crearMenuItem,
  editarMenuItem,
  formatearMenuItem,
  formatearCategoriaMenu
};
