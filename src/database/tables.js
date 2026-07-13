const crearTablasUsuarios = require('./tablesUsuarios');
const crearTablasHotel = require('./tablesHotel');
const crearTablasRestaurante = require('./tablesRestaurante');

async function crearTablas() {
  await crearTablasUsuarios();

  await crearTablasHotel();

  await crearTablasRestaurante();

  console.log('Proceso de creación de tablas finalizado');
}

module.exports = crearTablas;