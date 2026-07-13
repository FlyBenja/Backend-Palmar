const { QueryTypes } = require('sequelize');

const estadosReservacion = [
  {
    codigo: 'CONFIRMADA',
    nombre: 'Confirmada',
    descripcion: 'Reservación creada y confirmada'
  },
  {
    codigo: 'PAGADA',
    nombre: 'Pagada',
    descripcion: 'Reservación pagada por el cliente'
  }
];

async function insertarEstadosReservacion(sequelize, queryInterface) {
  for (const estadoReservacion of estadosReservacion) {
    const resultado = await sequelize.query(
      `
      SELECT id
      FROM estados_reservaciones
      WHERE codigo = :codigo
      LIMIT 1
      `,
      {
        replacements: {
          codigo: estadoReservacion.codigo
        },
        type: QueryTypes.SELECT
      }
    );

    if (resultado.length === 0) {
      await queryInterface.bulkInsert('estados_reservaciones', [
        {
          codigo: estadoReservacion.codigo,
          nombre: estadoReservacion.nombre,
          descripcion: estadoReservacion.descripcion,
          estado: true,
          fecha_creacion: new Date(),
          fecha_actualizacion: null
        }
      ]);

      console.log(`Estado de reservación insertado: ${estadoReservacion.codigo}`);
    } else {
      await sequelize.query(
        `
        UPDATE estados_reservaciones
        SET
          nombre = :nombre,
          descripcion = :descripcion,
          estado = true,
          fecha_actualizacion = NOW()
        WHERE codigo = :codigo
        `,
        {
          replacements: {
            codigo: estadoReservacion.codigo,
            nombre: estadoReservacion.nombre,
            descripcion: estadoReservacion.descripcion
          }
        }
      );

      console.log(`Estado de reservación actualizado: ${estadoReservacion.codigo}`);
    }
  }

  console.log('Seeder de estados de reservación finalizado');
}

module.exports = insertarEstadosReservacion;