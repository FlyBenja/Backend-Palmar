const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrdenDetalle = sequelize.define('OrdenDetalle', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  orden_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  menu_item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
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
}, {
  tableName: 'orden_detalles',
  timestamps: false,
});

module.exports = OrdenDetalle;