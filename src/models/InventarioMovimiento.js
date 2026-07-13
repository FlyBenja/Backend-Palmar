const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventarioMovimiento = sequelize.define('InventarioMovimiento', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  producto_inventario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
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
  },
  fecha_movimiento: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'inventario_movimientos',
  timestamps: false,
});

module.exports = InventarioMovimiento;