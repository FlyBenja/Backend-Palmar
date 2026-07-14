const { DataTypes } = require('sequelize');
const insertarEstadosHabitacion = require('./seeders/estadosHabitacionSeeder');
const insertarEstadosReservacion = require('./seeders/estadosReservacionSeeder');
const insertarTiposPago = require('./seeders/tiposPagoSeeder');
const {
  sequelize,
  queryInterface,
  columnaExiste,
  crearTablaSiNoExiste,
  agregarColumnaSiNoExiste,
} = require('./tableHelpers');

async function agregarEstadoIdAHabitaciones() {
  const tieneEstadoId = await columnaExiste('habitaciones', 'estado_id');
  let seAgregoEstadoId = false;

  if (!tieneEstadoId) {
    await queryInterface.addColumn('habitaciones', 'estado_id', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'estados_habitacion',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });

    seAgregoEstadoId = true;
    console.log('Columna estado_id agregada a habitaciones');
  }

  const tieneEstadoAntiguo = await columnaExiste('habitaciones', 'estado');

  if (tieneEstadoAntiguo) {
    await sequelize.query(`
      UPDATE habitaciones AS h
      SET estado_id = e.id
      FROM estados_habitacion AS e
      WHERE e.codigo = h.estado
      AND h.estado_id IS NULL
    `);

    console.log('Estados antiguos migrados hacia estado_id');
  }

  await sequelize.query(`
    UPDATE habitaciones AS h
    SET estado_id = (
      SELECT e.id
      FROM estados_habitacion AS e
      WHERE e.codigo = 'DISPONIBLE'
      LIMIT 1
    )
    WHERE h.estado_id IS NULL
  `);

  if (seAgregoEstadoId) {
    await queryInterface.changeColumn('habitaciones', 'estado_id', {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'estados_habitacion',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
  }

  console.log('estado_id de habitaciones configurado correctamente');
}

async function actualizarReservacionesExtras() {
  await agregarColumnaSiNoExiste('reservaciones', 'cantidad_personas_extra', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });

  await agregarColumnaSiNoExiste('reservaciones', 'adultos_extra', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });

  await agregarColumnaSiNoExiste('reservaciones', 'ninos_extra', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });

  await agregarColumnaSiNoExiste('reservaciones', 'monto_personas_extra', {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  });

  await agregarColumnaSiNoExiste('reservaciones', 'monto_adultos_extra', {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  });

  await agregarColumnaSiNoExiste('reservaciones', 'monto_ninos_extra', {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  });

  await agregarColumnaSiNoExiste('reservaciones', 'motivo_salida_anticipada', {
    type: DataTypes.TEXT,
    allowNull: true,
  });

  await agregarColumnaSiNoExiste('reservaciones', 'fecha_actualizacion', {
    type: DataTypes.DATE,
    allowNull: true,
  });
}

async function actualizarTarifasHospedaje() {
  await agregarColumnaSiNoExiste('tarifas', 'precio_adulto_extra', {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 100,
  });

  await agregarColumnaSiNoExiste('tarifas', 'precio_nino_extra', {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 50,
  });

  await agregarColumnaSiNoExiste('tarifas', 'desayunos_incluidos', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });

  await agregarColumnaSiNoExiste('tarifas', 'almuerzos_incluidos', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });

  await agregarColumnaSiNoExiste('tarifas', 'cenas_incluidas', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });
}

async function crearTablasHotel() {
  await crearTablaSiNoExiste('estados_habitacion', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    codigo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    nombre: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    permite_reservar: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
  });

  await insertarEstadosHabitacion(sequelize, queryInterface);

  await crearTablaSiNoExiste('habitaciones', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    numero: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    tipo: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    capacidad_personas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    estado_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'estados_habitacion',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
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
  });

  await agregarEstadoIdAHabitaciones();

  await crearTablaSiNoExiste('habitacion_imagenes', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    habitacion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'habitaciones',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    imagen_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    principal: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await crearTablaSiNoExiste('estados_reservaciones', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    codigo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    nombre: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
  });

  await insertarEstadosReservacion(sequelize, queryInterface);

  await crearTablaSiNoExiste('tipos_pago', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    codigo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    nombre: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
  });

  await insertarTiposPago(sequelize, queryInterface);

  await crearTablaSiNoExiste('tarifas', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    precio_adulto_extra: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 100,
    },
    precio_nino_extra: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 50,
    },
    desayunos_incluidos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    almuerzos_incluidos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    cenas_incluidas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
  });

  await actualizarTarifasHospedaje();

  await crearTablaSiNoExiste('reservaciones', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    habitacion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'habitaciones',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    tarifa_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tarifas',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    estado_reservacion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'estados_reservaciones',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    tipo_pago_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tipos_pago',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    nombre_cliente: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    nit: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    fecha_entrada: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fecha_salida: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    dias: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    cantidad_personas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    cantidad_personas_extra: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    adultos_extra: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    ninos_extra: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    monto_personas_extra: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    monto_adultos_extra: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    monto_ninos_extra: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    motivo_salida_anticipada: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    total_reservacion: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    precio_pagado: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await actualizarReservacionesExtras();

  console.log('Tablas de hotel configuradas correctamente');
}

module.exports = crearTablasHotel;