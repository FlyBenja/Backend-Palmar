const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MenuItemIngrediente = sequelize.define('MenuItemIngrediente', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  menu_item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  producto_inventario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  cantidad_requerida: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  fecha_actualizacion: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'menu_item_ingredientes',
  timestamps: false,
});

module.exports = MenuItemIngrediente;