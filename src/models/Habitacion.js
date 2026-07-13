const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const EstadoHabitacion = require('./EstadoHabitacion');

const Habitacion = sequelize.define('Habitacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  tipo: {
    type: DataTypes.STRING(80),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  capacidad_personas: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  estado_id: {
    type: DataTypes.INTEGER,
    allowNull: false
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
  tableName: 'habitaciones',
  timestamps: false
});

Habitacion.belongsTo(EstadoHabitacion, {
  foreignKey: 'estado_id',
  as: 'estado_habitacion'
});

module.exports = Habitacion;