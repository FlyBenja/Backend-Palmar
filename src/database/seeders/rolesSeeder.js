const { QueryTypes } = require('sequelize');

const roles = [
  {
    nombre: 'Manager',
    descripcion: 'Usuario con acceso completo al sistema'
  },
  {
    nombre: 'Empleado',
    descripcion: 'Usuario encargado de administrar operaciones del hotel y restaurante'
  },
  {
    nombre: 'Cocina',
    descripcion: 'Usuario encargado de gestionar las comidas'
  },
];

async function insertarRoles(sequelize, queryInterface) {
  for (const rol of roles) {
    const resultado = await sequelize.query(
      `
      SELECT id
      FROM roles
      WHERE nombre = :nombre
      LIMIT 1
      `,
      {
        replacements: {
          nombre: rol.nombre
        },
        type: QueryTypes.SELECT
      }
    );

    if (resultado.length === 0) {
      await queryInterface.bulkInsert('roles', [
        {
          nombre: rol.nombre,
          descripcion: rol.descripcion,
          estado: true,
          fecha_creacion: new Date(),
          fecha_actualizacion: null
        }
      ]);

      console.log(`Rol insertado: ${rol.nombre}`);
    } else {
      await sequelize.query(
        `
        UPDATE roles
        SET
          descripcion = :descripcion,
          estado = true,
          fecha_actualizacion = NOW()
        WHERE nombre = :nombre
        `,
        {
          replacements: {
            nombre: rol.nombre,
            descripcion: rol.descripcion
          }
        }
      );

      console.log(`Rol actualizado: ${rol.nombre}`);
    }
  }

  console.log('Seeder de roles finalizado');
}

module.exports = insertarRoles;