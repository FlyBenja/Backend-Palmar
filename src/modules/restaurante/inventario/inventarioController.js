const { Op } = require('sequelize');

const CategoriaInventario = require('../../../models/CategoriaInventario');
const ProductoInventario = require('../../../models/ProductoInventario');
const InventarioMovimiento = require('../../../models/InventarioMovimiento');
const TipoPago = require('../../../models/TipoPago');

function obtenerUsuarioId(req) {
  return req.usuario ? Number(req.usuario.id || req.usuario.usuario_id || 0) || null : null;
}

async function obtenerTipoPagoActivo(tipoPagoId) {
  if (!tipoPagoId) return null;

  return TipoPago.findOne({
    where: {
      id: tipoPagoId,
      estado: true
    }
  });
}

function formatearCategoria(categoria) {
  const data = categoria.toJSON ? categoria.toJSON() : categoria;

  return {
    id: data.id,
    nombre: data.nombre,
    descripcion: data.descripcion,
    estado: data.estado,
    fecha_creacion: data.fecha_creacion,
    fecha_actualizacion: data.fecha_actualizacion
  };
}

async function formatearProducto(producto) {
  const data = producto.toJSON ? producto.toJSON() : producto;
  const categoria = await CategoriaInventario.findByPk(data.categoria_id);

  return {
    id: data.id,
    categoria_id: data.categoria_id,
    categoria: categoria ? formatearCategoria(categoria) : null,
    nombre: data.nombre,
    unidad_medida: data.unidad_medida,
    stock_actual: data.stock_actual,
    stock_minimo: data.stock_minimo,
    costo_unitario: data.costo_unitario,
    estado: data.estado,
    fecha_creacion: data.fecha_creacion,
    fecha_actualizacion: data.fecha_actualizacion
  };
}

async function formatearMovimiento(movimiento) {
  const data = movimiento.toJSON ? movimiento.toJSON() : movimiento;
  const producto = await ProductoInventario.findByPk(data.producto_inventario_id);
  const tipoPago = data.tipo_pago_id ? await TipoPago.findByPk(data.tipo_pago_id) : null;

  return {
    id: data.id,
    producto_inventario_id: data.producto_inventario_id,
    producto: producto ? await formatearProducto(producto) : null,
    tipo_movimiento: data.tipo_movimiento,
    cantidad: data.cantidad,
    stock_anterior: data.stock_anterior,
    stock_nuevo: data.stock_nuevo,
    costo_unitario: data.costo_unitario,
    tipo_pago_id: data.tipo_pago_id,
    tipo_pago: tipoPago
      ? {
          id: tipoPago.id,
          codigo: tipoPago.codigo,
          nombre: tipoPago.nombre
        }
      : null,
    total: Number(data.cantidad || 0) * Number(data.costo_unitario || 0),
    referencia_tipo: data.referencia_tipo,
    referencia_id: data.referencia_id,
    observacion: data.observacion,
    usuario_id: data.usuario_id,
    fecha_movimiento: data.fecha_movimiento
  };
}

async function listarCategoriasInventario(req, res) {
  try {
    const categorias = await CategoriaInventario.findAll({
      order: [['id', 'ASC']]
    });

    return res.json({
      mensaje: 'Categorías de inventario obtenidas correctamente',
      categorias: categorias.map(formatearCategoria)
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al listar categorías de inventario'
    });
  }
}

async function crearCategoriaInventario(req, res) {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({
        mensaje: 'nombre es obligatorio'
      });
    }

    const existe = await CategoriaInventario.findOne({ where: { nombre } });

    if (existe) {
      return res.status(409).json({
        mensaje: 'Ya existe una categoría de inventario con ese nombre'
      });
    }

    const categoria = await CategoriaInventario.create({
      nombre,
      descripcion: descripcion || null,
      estado: true,
      fecha_creacion: new Date(),
      fecha_actualizacion: null
    });

    return res.status(201).json({
      mensaje: 'Categoría de inventario creada correctamente',
      categoria: formatearCategoria(categoria)
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al crear categoría de inventario'
    });
  }
}

async function editarCategoriaInventario(req, res) {
  try {
    const { id } = req.params;
    const { nombre, descripcion, estado } = req.body;

    const categoria = await CategoriaInventario.findByPk(id);

    if (!categoria) {
      return res.status(404).json({
        mensaje: 'Categoría de inventario no encontrada'
      });
    }

    if (nombre !== undefined) {
      const existe = await CategoriaInventario.findOne({
        where: {
          nombre,
          id: { [Op.ne]: id }
        }
      });

      if (existe) {
        return res.status(409).json({
          mensaje: 'Ya existe una categoría de inventario con ese nombre'
        });
      }

      categoria.nombre = nombre;
    }

    if (descripcion !== undefined) {
      categoria.descripcion = descripcion || null;
    }

    if (estado !== undefined) {
      categoria.estado = Boolean(estado);
    }

    categoria.fecha_actualizacion = new Date();

    await categoria.save();

    return res.json({
      mensaje: 'Categoría de inventario actualizada correctamente',
      categoria: formatearCategoria(categoria)
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al actualizar categoría de inventario'
    });
  }
}

async function listarProductosInventario(req, res) {
  try {
    const { categoria_id, bajo_stock } = req.query;
    const where = {};

    if (categoria_id) {
      where.categoria_id = categoria_id;
    }

    const productos = await ProductoInventario.findAll({
      where,
      order: [['id', 'ASC']]
    });

    let productosFiltrados = productos;

    if (bajo_stock === 'true') {
      productosFiltrados = productos.filter((producto) => {
        return Number(producto.stock_actual) <= Number(producto.stock_minimo);
      });
    }

    return res.json({
      mensaje: 'Productos de inventario obtenidos correctamente',
      productos: await Promise.all(productosFiltrados.map(formatearProducto))
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al listar productos de inventario'
    });
  }
}

async function crearProductoInventario(req, res) {
  try {
    const {
      categoria_id,
      nombre,
      unidad_medida,
      stock_actual,
      stock_minimo,
      costo_unitario,
      tipo_pago_id
    } = req.body;

    if (!categoria_id || !nombre) {
      return res.status(400).json({
        mensaje: 'categoria_id y nombre son obligatorios'
      });
    }

    const categoria = await CategoriaInventario.findOne({
      where: {
        id: categoria_id,
        estado: true
      }
    });

    if (!categoria) {
      return res.status(404).json({
        mensaje: 'Categoría de inventario no encontrada o inactiva'
      });
    }

    const stockInicial = Number(stock_actual || 0);
    const costoUnitario = Number(costo_unitario || 0);
    const tipoPago = await obtenerTipoPagoActivo(tipo_pago_id);

    if (stockInicial > 0 && !tipoPago) {
      return res.status(400).json({
        mensaje: 'tipo_pago_id es obligatorio para registrar el gasto inicial del producto'
      });
    }

    const producto = await ProductoInventario.create({
      categoria_id,
      nombre,
      unidad_medida: unidad_medida || 'UNIDAD',
      stock_actual: stockInicial,
      stock_minimo: stock_minimo || 0,
      costo_unitario: costoUnitario,
      estado: true,
      fecha_creacion: new Date(),
      fecha_actualizacion: null
    });

    let movimientoInicial = null;

    if (stockInicial > 0) {
      movimientoInicial = await InventarioMovimiento.create({
        producto_inventario_id: producto.id,
        tipo_movimiento: 'ENTRADA',
        cantidad: stockInicial,
        stock_anterior: 0,
        stock_nuevo: stockInicial,
        costo_unitario: costoUnitario,
        tipo_pago_id: tipoPago ? tipoPago.id : null,
        referencia_tipo: 'CREACION_PRODUCTO',
        referencia_id: producto.id,
        observacion: `Stock inicial al crear producto ${producto.nombre}`,
        usuario_id: obtenerUsuarioId(req),
        fecha_movimiento: new Date()
      });
    }

    return res.status(201).json({
      mensaje: 'Producto de inventario creado correctamente',
      producto: await formatearProducto(producto),
      movimiento: movimientoInicial ? await formatearMovimiento(movimientoInicial) : null
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al crear producto de inventario'
    });
  }
}

async function editarProductoInventario(req, res) {
  try {
    const { id } = req.params;
    const {
      categoria_id,
      nombre,
      unidad_medida,
      stock_minimo,
      costo_unitario,
      estado
    } = req.body;

    const producto = await ProductoInventario.findByPk(id);

    if (!producto) {
      return res.status(404).json({
        mensaje: 'Producto de inventario no encontrado'
      });
    }

    if (categoria_id !== undefined) {
      const categoria = await CategoriaInventario.findOne({
        where: {
          id: categoria_id,
          estado: true
        }
      });

      if (!categoria) {
        return res.status(404).json({
          mensaje: 'Categoría de inventario no encontrada o inactiva'
        });
      }

      producto.categoria_id = categoria_id;
    }

    if (nombre !== undefined) producto.nombre = nombre;
    if (unidad_medida !== undefined) producto.unidad_medida = unidad_medida || 'UNIDAD';
    if (stock_minimo !== undefined) producto.stock_minimo = stock_minimo || 0;
    if (costo_unitario !== undefined) producto.costo_unitario = costo_unitario || 0;
    if (estado !== undefined) producto.estado = Boolean(estado);

    producto.fecha_actualizacion = new Date();

    await producto.save();

    return res.json({
      mensaje: 'Producto de inventario actualizado correctamente',
      producto: await formatearProducto(producto)
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al actualizar producto de inventario'
    });
  }
}

async function crearMovimientoInventario(req, res) {
  try {
    const {
      producto_inventario_id,
      tipo_movimiento,
      cantidad,
      costo_unitario,
      tipo_pago_id,
      observacion
    } = req.body;

    if (!producto_inventario_id || !tipo_movimiento || cantidad === undefined || cantidad === null || cantidad === '') {
      return res.status(400).json({
        mensaje: 'producto_inventario_id, tipo_movimiento y cantidad son obligatorios'
      });
    }

    if (!['ENTRADA', 'SALIDA'].includes(tipo_movimiento)) {
      return res.status(400).json({
        mensaje: 'tipo_movimiento debe ser ENTRADA o SALIDA'
      });
    }

    const producto = await ProductoInventario.findByPk(producto_inventario_id);

    if (!producto) {
      return res.status(404).json({
        mensaje: 'Producto de inventario no encontrado'
      });
    }

    const cantidadNumero = Number(cantidad);

    if (cantidadNumero < 0) {
      return res.status(400).json({
        mensaje: 'cantidad no puede ser negativa'
      });
    }

    const stockAnterior = Number(producto.stock_actual || 0);
    let stockNuevo = stockAnterior;

    if (tipo_movimiento === 'ENTRADA') {
      stockNuevo = stockAnterior + cantidadNumero;
    }

    if (tipo_movimiento === 'SALIDA') {
      stockNuevo = stockAnterior - cantidadNumero;

      if (stockNuevo < 0) {
        return res.status(400).json({
          mensaje: 'La salida no puede dejar el stock en negativo'
        });
      }
    }


    const costoFinal = costo_unitario !== undefined && costo_unitario !== null && costo_unitario !== ''
      ? Number(costo_unitario)
      : Number(producto.costo_unitario || 0);
    const tipoPago = await obtenerTipoPagoActivo(tipo_pago_id);

    if (tipo_movimiento === 'ENTRADA' && cantidadNumero > 0 && !tipoPago) {
      return res.status(400).json({
        mensaje: 'tipo_pago_id es obligatorio para movimientos de entrada'
      });
    }

    producto.stock_actual = stockNuevo;

    if (tipo_movimiento === 'ENTRADA' && costoFinal >= 0) {
      producto.costo_unitario = costoFinal;
    }

    producto.fecha_actualizacion = new Date();

    await producto.save();

    const movimiento = await InventarioMovimiento.create({
      producto_inventario_id,
      tipo_movimiento,
      cantidad: cantidadNumero,
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      costo_unitario: costoFinal,
      tipo_pago_id: tipoPago ? tipoPago.id : null,
      referencia_tipo: 'MANUAL',
      referencia_id: null,
      observacion: observacion || null,
      usuario_id: obtenerUsuarioId(req),
      fecha_movimiento: new Date()
    });

    return res.status(201).json({
      mensaje: 'Movimiento de inventario creado correctamente',
      movimiento: await formatearMovimiento(movimiento),
      producto: await formatearProducto(producto)
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al crear movimiento de inventario'
    });
  }
}

async function listarMovimientosInventario(req, res) {
  try {
    const { producto_inventario_id } = req.query;
    const where = {};

    if (producto_inventario_id) {
      where.producto_inventario_id = producto_inventario_id;
    }

    const movimientos = await InventarioMovimiento.findAll({
      where,
      order: [['fecha_movimiento', 'DESC'], ['id', 'DESC']],
      limit: 100
    });

    return res.json({
      mensaje: 'Movimientos de inventario obtenidos correctamente',
      movimientos: await Promise.all(movimientos.map(formatearMovimiento))
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al listar movimientos de inventario'
    });
  }
}

module.exports = {
  listarCategoriasInventario,
  crearCategoriaInventario,
  editarCategoriaInventario,
  listarProductosInventario,
  crearProductoInventario,
  editarProductoInventario,
  crearMovimientoInventario,
  listarMovimientosInventario
};
