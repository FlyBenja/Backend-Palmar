const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Evento = sequelize.define('Evento', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  cliente_nombre: { type: DataTypes.STRING(150), allowNull: false },
  nit: { type: DataTypes.STRING(30), allowNull: true },
  telefono: { type: DataTypes.STRING(30), allowNull: true },
  empresa: { type: DataTypes.STRING(150), allowNull: true },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  cantidad_personas: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  monto_cobrado: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  fecha_evento: { type: DataTypes.DATEONLY, allowNull: true },
  estado: { type: DataTypes.ENUM('ABIERTO', 'CERRADO', 'CANCELADO'), allowNull: false, defaultValue: 'ABIERTO' },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  tipo_pago_id: { type: DataTypes.INTEGER, allowNull: true },
  fecha_cierre: { type: DataTypes.DATE, allowNull: true },
  fecha_creacion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  fecha_actualizacion: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'eventos', timestamps: false });

module.exports = Evento;
