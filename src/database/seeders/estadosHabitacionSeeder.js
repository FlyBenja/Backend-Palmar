const { QueryTypes } = require('sequelize');

const estadosHabitacion = [
  {
    codigo: 'DISPONIBLE',
    nombre: 'Disponible',
    descripcion: 'Habitación disponible para reservar u ocupar',
    color: '#28a745',
    permite_reservar: true
  },
  {
    codigo: 'OCUPADA',
    nombre: 'Ocupada',
    descripcion: 'Habitación ocupada por un huésped',
    color: '#dc3545',
    permite_reservar: false
  },
  {
    codigo: 'RESERVADA',
    nombre: 'Reservada',
    descripcion: 'Habitación reservada para un huésped',
    color: '#ffc107',
    permite_reservar: false
  },
  {
    codigo: 'LIMPIEZA',
    nombre: 'Limpieza',
    descripcion: 'Habitación pendiente de limpieza',
    color: '#17a2b8',
    permite_reservar: false
  },
  {
    codigo: 'MANTENIMIENTO',
    nombre: 'Mantenimiento',
    descripcion: 'Habitación fuera de servicio por mantenimiento',
    color: '#6c757d',
    permite_reservar: false
  },
  {
    codigo: 'INACTIVA',
    nombre: 'Inactiva',
    descripcion: 'Habitación deshabilitada, no visible para reservas',
    color: '#343a40',
    permite_reservar: false
  }
];

async function insertarEstadosHabitacion(sequelize, queryInterface) {
  for (const estadoHabitacion of estadosHabitacion) {
    const resultado = await sequelize.query(
      `
      SELECT id
      FROM estados_habitacion
      WHERE codigo = :codigo
      LIMIT 1
      `,
      {
        replacements: {
          codigo: estadoHabitacion.codigo
        },
        type: QueryTypes.SELECT
      }
    );

    if (resultado.length === 0) {
      await queryInterface.bulkInsert('estados_habitacion', [
        {
          codigo: estadoHabitacion.codigo,
          nombre: estadoHabitacion.nombre,
          descripcion: estadoHabitacion.descripcion,
          color: estadoHabitacion.color,
          permite_reservar: estadoHabitacion.permite_reservar,
          estado: true,
          fecha_creacion: new Date(),
          fecha_actualizacion: null
        }
      ]);

      console.log(`Estado de habitación insertado: ${estadoHabitacion.codigo}`);
    } else {
      await sequelize.query(
        `
        UPDATE estados_habitacion
        SET
          nombre = :nombre,
          descripcion = :descripcion,
          color = :color,
          permite_reservar = :permite_reservar,
          estado = true,
          fecha_actualizacion = NOW()
        WHERE codigo = :codigo
        `,
        {
          replacements: {
            codigo: estadoHabitacion.codigo,
            nombre: estadoHabitacion.nombre,
            descripcion: estadoHabitacion.descripcion,
            color: estadoHabitacion.color,
            permite_reservar: estadoHabitacion.permite_reservar
          }
        }
      );

      console.log(`Estado de habitación actualizado: ${estadoHabitacion.codigo}`);
    }
  }

  console.log('Seeder de estados de habitación finalizado');
}

module.exports = insertarEstadosHabitacion;