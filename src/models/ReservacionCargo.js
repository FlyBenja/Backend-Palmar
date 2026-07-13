const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReservacionCargo = sequelize.define('ReservacionCargo', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  reservacion_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  orden_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  tipo_cargo: {
    type: DataTypes.ENUM('ORDEN', 'MANUAL', 'EXTRA'),
    allowNull: false,
    defaultValue: 'ORDEN',
  },
  descripcion: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  estado: {
    type: DataTypes.ENUM('PENDIENTE', 'PAGADO', 'ANULADO'),
    allowNull: false,
    defaultValue: 'PENDIENTE',
  },
  fecha_cargo: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'reservacion_cargos',
  timestamps: false,
});

module.exports = ReservacionCargo;