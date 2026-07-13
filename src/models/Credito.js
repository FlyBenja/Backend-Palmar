const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Credito = sequelize.define('Credito', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  cliente_nombre: { type: DataTypes.STRING(150), allowNull: false },
  nit: { type: DataTypes.STRING(30), allowNull: true },
  telefono: { type: DataTypes.STRING(30), allowNull: true },
  empresa: { type: DataTypes.STRING(150), allowNull: true },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  estado: { type: DataTypes.ENUM('PENDIENTE', 'PAGADO', 'CANCELADO'), allowNull: false, defaultValue: 'PENDIENTE' },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  tipo_pago_id: { type: DataTypes.INTEGER, allowNull: true },
  fecha_pago: { type: DataTypes.DATE, allowNull: true },
  fecha_creacion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  fecha_actualizacion: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'creditos', timestamps: false });

module.exports = Credito;
