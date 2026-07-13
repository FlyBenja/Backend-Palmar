const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pago = sequelize.define('Pago', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  orden_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  reservacion_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  tipo_pago_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('PENDIENTE', 'PAGADO', 'ANULADO'),
    allowNull: false,
    defaultValue: 'PAGADO',
  },
  referencia: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  fecha_pago: {
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
  tableName: 'pagos',
  timestamps: false,
});

module.exports = Pago;