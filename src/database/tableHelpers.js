const sequelize = require('../config/database');

const queryInterface = sequelize.getQueryInterface();

async function tablaExiste(nombreTabla) {
  const tablas = await queryInterface.showAllTables();

  return tablas.some((tabla) => {
    if (typeof tabla === 'string') {
      return tabla === nombreTabla;
    }

    return tabla.tableName === nombreTabla;
  });
}

async function columnaExiste(nombreTabla, nombreColumna) {
  const existeTabla = await tablaExiste(nombreTabla);

  if (!existeTabla) {
    return false;
  }

  const descripcion = await queryInterface.describeTable(nombreTabla);
  return !!descripcion[nombreColumna];
}

async function crearTablaSiNoExiste(nombreTabla, columnas) {
  const existe = await tablaExiste(nombreTabla);

  if (!existe) {
    await queryInterface.createTable(nombreTabla, columnas);
    console.log(`Tabla creada: ${nombreTabla}`);
  } else {
    console.log(`Tabla ya existe: ${nombreTabla}`);
  }
}

async function agregarColumnaSiNoExiste(nombreTabla, nombreColumna, definicion) {
  const existe = await columnaExiste(nombreTabla, nombreColumna);

  if (!existe) {
    await queryInterface.addColumn(nombreTabla, nombreColumna, definicion);
    console.log(`Columna agregada: ${nombreTabla}.${nombreColumna}`);
  }
}

async function cambiarColumnaSiExiste(nombreTabla, nombreColumna, definicion) {
  const existe = await columnaExiste(nombreTabla, nombreColumna);

  if (existe) {
    await queryInterface.changeColumn(nombreTabla, nombreColumna, definicion);
    console.log(`Columna actualizada: ${nombreTabla}.${nombreColumna}`);
  }
}

module.exports = {
  sequelize,
  queryInterface,
  tablaExiste,
  columnaExiste,
  crearTablaSiNoExiste,
  agregarColumnaSiNoExiste,
  cambiarColumnaSiExiste,
};