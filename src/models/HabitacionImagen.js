const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Habitacion = require('./Habitacion');

const HabitacionImagen = sequelize.define('HabitacionImagen', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  habitacion_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  imagen_url: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  principal: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'habitacion_imagenes',
  timestamps: false
});

HabitacionImagen.belongsTo(Habitacion, {
  foreignKey: 'habitacion_id',
  as: 'habitacion'
});

module.exports = HabitacionImagen;