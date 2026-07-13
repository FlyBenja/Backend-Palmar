const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TipoPago = sequelize.define('TipoPago', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  codigo: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true
  },
  nombre: {
    type: DataTypes.STRING(80),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    allowNull: false
  },
  fecha_actualizacion: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'tipos_pago',
  timestamps: false
});

module.exports = TipoPago;