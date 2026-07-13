const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EstadoHabitacion = sequelize.define('EstadoHabitacion', {
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
  color: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  permite_reservar: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
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
  tableName: 'estados_habitacion',
  timestamps: false
});

module.exports = EstadoHabitacion;