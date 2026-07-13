    const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CajaDiaria = sequelize.define('CajaDiaria', {
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
  },
  usuario_cierre_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
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
}, {
  tableName: 'cajas_diarias',
  timestamps: false,
});

module.exports = CajaDiaria;