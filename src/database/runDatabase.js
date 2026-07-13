const sequelize = require('../config/database');
const crearTablas = require('./tables');
require('dotenv').config();

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a MySQL exitosa');

    await crearTablas();

    console.log('Base de datos inicializada correctamente');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);

    await sequelize.close();
    process.exit(1);
  }
}

main();