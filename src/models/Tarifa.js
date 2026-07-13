const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tarifa = sequelize.define('Tarifa', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(80),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  precio_adulto_extra: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 100
  },
  precio_nino_extra: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 50
  },
  desayunos_incluidos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  almuerzos_incluidos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  cenas_incluidas: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
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
  tableName: 'tarifas',
  timestamps: false
});

module.exports = Tarifa;