require('dotenv').config();

const { Sequelize } = require('sequelize');

if (!process.env.DATABASE_URL) {
  throw new Error('La variable DATABASE_URL no está configurada');
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,

  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;