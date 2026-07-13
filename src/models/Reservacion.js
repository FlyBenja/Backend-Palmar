const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Habitacion = require('./Habitacion');
const EstadoReservacion = require('./EstadoReservacion');
const Tarifa = require('./Tarifa');
const TipoPago = require('./TipoPago');

const Reservacion = sequelize.define('Reservacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  habitacion_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tarifa_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  estado_reservacion_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipo_pago_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  nombre_cliente: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  nit: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  fecha_entrada: {
    type: DataTypes.DATE,
    allowNull: false
  },
  fecha_salida: {
    type: DataTypes.DATE,
    allowNull: false
  },
  dias: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  cantidad_personas: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  cantidad_personas_extra: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  adultos_extra: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  ninos_extra: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  monto_personas_extra: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  monto_adultos_extra: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  monto_ninos_extra: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  motivo_salida_anticipada: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fecha_actualizacion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  total_reservacion: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  precio_pagado: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'reservaciones',
  timestamps: false
});

Reservacion.belongsTo(Habitacion, {
  foreignKey: 'habitacion_id',
  as: 'habitacion'
});

Reservacion.belongsTo(Tarifa, {
  foreignKey: 'tarifa_id',
  as: 'tarifa'
});

Reservacion.belongsTo(EstadoReservacion, {
  foreignKey: 'estado_reservacion_id',
  as: 'estado_reservacion'
});

Reservacion.belongsTo(TipoPago, {
  foreignKey: 'tipo_pago_id',
  as: 'tipo_pago'
});

module.exports = Reservacion;