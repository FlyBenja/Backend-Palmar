const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Orden = sequelize.define('Orden', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  reservacion_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
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
}, {
  tableName: 'ordenes',
  timestamps: false,
});

module.exports = Orden;