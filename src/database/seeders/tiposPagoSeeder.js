const { QueryTypes } = require('sequelize');

const tiposPago = [
  {
    codigo: 'EFECTIVO',
    nombre: 'Efectivo',
    descripcion: 'Pago realizado en efectivo'
  },
  {
    codigo: 'POS',
    nombre: 'POS',
    descripcion: 'Pago realizado con tarjeta por POS'
  },
  {
    codigo: 'CHEQUE',
    nombre: 'Cheque',
    descripcion: 'Pago realizado con cheque'
  }
];

async function insertarTiposPago(sequelize, queryInterface) {
  for (const tipoPago of tiposPago) {
    const resultado = await sequelize.query(
      `
      SELECT id
      FROM tipos_pago
      WHERE codigo = :codigo
      LIMIT 1
      `,
      {
        replacements: {
          codigo: tipoPago.codigo
        },
        type: QueryTypes.SELECT
      }
    );

    if (resultado.length === 0) {
      await queryInterface.bulkInsert('tipos_pago', [
        {
          codigo: tipoPago.codigo,
          nombre: tipoPago.nombre,
          descripcion: tipoPago.descripcion,
          estado: true,
          fecha_creacion: new Date(),
          fecha_actualizacion: null
        }
      ]);

      console.log(`Tipo de pago insertado: ${tipoPago.codigo}`);
    } else {
      await sequelize.query(
        `
        UPDATE tipos_pago
        SET
          nombre = :nombre,
          descripcion = :descripcion,
          estado = true,
          fecha_actualizacion = NOW()
        WHERE codigo = :codigo
        `,
        {
          replacements: {
            codigo: tipoPago.codigo,
            nombre: tipoPago.nombre,
            descripcion: tipoPago.descripcion
          }
        }
      );

      console.log(`Tipo de pago actualizado: ${tipoPago.codigo}`);
    }
  }

  console.log('Seeder de tipos de pago finalizado');
}

module.exports = insertarTiposPago;