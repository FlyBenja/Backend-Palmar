const { DataTypes } = require('sequelize');
const {
  crearTablaSiNoExiste,
  agregarColumnaSiNoExiste,
  cambiarColumnaSiExiste,
} = require('./tableHelpers');

async function actualizarOrdenesExistentes() {
  await agregarColumnaSiNoExiste('ordenes', 'reservacion_id', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'reservaciones',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}

async function actualizarOrdenDetallesExistentes() {
  await agregarColumnaSiNoExiste('orden_detalles', 'menu_item_id', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'menu_items',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });

  await cambiarColumnaSiExiste('orden_detalles', 'comida_id', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'comidas',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });
}


async function actualizarOrdenDetallesExclusiones() {
  await agregarColumnaSiNoExiste('orden_detalles', 'exclusiones_json', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
}

async function actualizarOrdenesCancelacion() {
  await agregarColumnaSiNoExiste('ordenes', 'motivo_cancelacion', {
    type: DataTypes.TEXT,
    allowNull: true,
  });

  await agregarColumnaSiNoExiste('ordenes', 'fecha_cancelacion', {
    type: DataTypes.DATE,
    allowNull: true,
  });
}


async function actualizarMovimientosInventarioTipoPago() {
  await agregarColumnaSiNoExiste('inventario_movimientos', 'tipo_pago_id', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tipos_pago',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}

async function actualizarCategoriasMenuOrden() {
  await agregarColumnaSiNoExiste('categorias_menu', 'orden', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });
}

async function actualizarOrdenesRestauranteExtendidas() {
  await agregarColumnaSiNoExiste('ordenes', 'evento_id', {
    type: DataTypes.INTEGER,
    allowNull: true,
  });

  await agregarColumnaSiNoExiste('ordenes', 'credito_id', {
    type: DataTypes.INTEGER,
    allowNull: true,
  });

  await cambiarColumnaSiExiste('ordenes', 'tipo_orden', {
    type: DataTypes.ENUM('MESA', 'LLEVAR', 'HABITACION', 'EMPLEADO', 'EVENTO', 'CREDITO'),
    allowNull: false,
    defaultValue: 'MESA',
  });
}

async function actualizarEventosVentaDirecta() {
  await agregarColumnaSiNoExiste('eventos', 'cantidad_personas', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });

  await agregarColumnaSiNoExiste('eventos', 'monto_cobrado', {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  });
}

async function actualizarPagosExistentes() {
  await agregarColumnaSiNoExiste('pagos', 'tipo_pago_id', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tipos_pago',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}

async function crearTablasRestaurante() {
  await crearTablaSiNoExiste('categorias_inventario', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    orden: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await crearTablaSiNoExiste('productos_inventario', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    categoria_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categorias_inventario',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    nombre: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    unidad_medida: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'UNIDAD',
    },
    stock_actual: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    stock_minimo: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    costo_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await crearTablaSiNoExiste('categorias_menu', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    orden: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await actualizarCategoriasMenuOrden();

  await crearTablaSiNoExiste('menu_items', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    categoria_menu_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categorias_menu',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    nombre: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    tipo: {
      type: DataTypes.ENUM('COMIDA', 'BEBIDA', 'POSTRE', 'EXTRA', 'OTRO'),
      allowNull: false,
      defaultValue: 'COMIDA',
    },
    disponible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    imagen_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await crearTablaSiNoExiste('menu_item_ingredientes', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    menu_item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'menu_items',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    producto_inventario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'productos_inventario',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    cantidad_requerida: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await crearTablaSiNoExiste('ordenes', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    reservacion_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'reservaciones',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    tipo_orden: {
      type: DataTypes.ENUM('MESA', 'LLEVAR', 'HABITACION', 'EMPLEADO', 'EVENTO', 'CREDITO'),
      allowNull: false,
      defaultValue: 'MESA',
    },
    numero_mesa: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    habitacion_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'habitaciones',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    evento_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    credito_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    estado: {
      type: DataTypes.ENUM(
        'PENDIENTE',
        'EN_COCINA',
        'LISTA',
        'ENTREGADA',
        'CANCELADA',
      ),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    motivo_cancelacion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fecha_cancelacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await actualizarOrdenesExistentes();
  await actualizarOrdenesCancelacion();
  await actualizarOrdenesRestauranteExtendidas();

  await crearTablaSiNoExiste('orden_detalles', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orden_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ordenes',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    menu_item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'menu_items',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    precio_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    exclusiones_json: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estado_cocina: {
      type: DataTypes.ENUM(
        'PENDIENTE',
        'EN_PREPARACION',
        'LISTO',
        'ENTREGADO',
      ),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await actualizarOrdenDetallesExistentes();
  await actualizarOrdenDetallesExclusiones();

  await crearTablaSiNoExiste('inventario_movimientos', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    producto_inventario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'productos_inventario',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    tipo_movimiento: {
      type: DataTypes.ENUM('ENTRADA', 'SALIDA', 'AJUSTE'),
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    stock_anterior: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    stock_nuevo: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    costo_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    tipo_pago_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tipos_pago',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    referencia_tipo: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    referencia_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    observacion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    fecha_movimiento: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await actualizarMovimientosInventarioTipoPago();

  await crearTablaSiNoExiste('reservacion_cargos', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    reservacion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'reservaciones',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    orden_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'ordenes',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    tipo_cargo: {
      type: DataTypes.ENUM('ORDEN', 'MANUAL', 'EXTRA'),
      allowNull: false,
      defaultValue: 'ORDEN',
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    monto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    estado: {
      type: DataTypes.ENUM('PENDIENTE', 'PAGADO', 'ANULADO'),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    },
    fecha_cargo: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await crearTablaSiNoExiste('pagos', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orden_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'ordenes',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    reservacion_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'reservaciones',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    tipo_pago_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tipos_pago',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    monto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM('PENDIENTE', 'PAGADO', 'ANULADO'),
      allowNull: false,
      defaultValue: 'PAGADO',
    },
    referencia: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    fecha_pago: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await actualizarPagosExistentes();


  await crearTablaSiNoExiste('eventos', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    cliente_nombre: { type: DataTypes.STRING(150), allowNull: false },
    nit: { type: DataTypes.STRING(30), allowNull: true },
    telefono: { type: DataTypes.STRING(30), allowNull: true },
    empresa: { type: DataTypes.STRING(150), allowNull: true },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    cantidad_personas: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    monto_cobrado: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    fecha_evento: { type: DataTypes.DATEONLY, allowNull: true },
    estado: { type: DataTypes.ENUM('ABIERTO', 'CERRADO', 'CANCELADO'), allowNull: false, defaultValue: 'ABIERTO' },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    tipo_pago_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'tipos_pago', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
    fecha_cierre: { type: DataTypes.DATE, allowNull: true },
    fecha_creacion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    fecha_actualizacion: { type: DataTypes.DATE, allowNull: true },
  });

  await actualizarEventosVentaDirecta();

  await crearTablaSiNoExiste('creditos', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    cliente_nombre: { type: DataTypes.STRING(150), allowNull: false },
    nit: { type: DataTypes.STRING(30), allowNull: true },
    telefono: { type: DataTypes.STRING(30), allowNull: true },
    empresa: { type: DataTypes.STRING(150), allowNull: true },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    estado: { type: DataTypes.ENUM('PENDIENTE', 'PAGADO', 'CANCELADO'), allowNull: false, defaultValue: 'PENDIENTE' },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    tipo_pago_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'tipos_pago', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
    fecha_pago: { type: DataTypes.DATE, allowNull: true },
    fecha_creacion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    fecha_actualizacion: { type: DataTypes.DATE, allowNull: true },
  });

  await crearTablaSiNoExiste('credito_cargos', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    credito_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'creditos', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
    orden_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'ordenes', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
    reservacion_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'reservaciones', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
    tipo_cargo: { type: DataTypes.ENUM('HABITACION', 'RESTAURANTE', 'MANUAL', 'OTRO'), allowNull: false, defaultValue: 'MANUAL' },
    descripcion: { type: DataTypes.STRING(255), allowNull: false },
    monto: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    estado: { type: DataTypes.ENUM('PENDIENTE', 'PAGADO', 'ANULADO'), allowNull: false, defaultValue: 'PENDIENTE' },
    fecha_cargo: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    fecha_creacion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  await crearTablaSiNoExiste('cajas_diarias', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      unique: true,
    },
    usuario_apertura_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    usuario_cierre_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    monto_inicial: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total_efectivo: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total_pos: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total_transferencia: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total_general: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    estado: {
      type: DataTypes.ENUM('ABIERTA', 'CERRADA'),
      allowNull: false,
      defaultValue: 'ABIERTA',
    },
    fecha_apertura: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_cierre: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  console.log('Tablas de restaurante, inventario, órdenes y finanzas configuradas correctamente');
}

module.exports = crearTablasRestaurante;