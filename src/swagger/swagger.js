const swaggerJsdoc = require('swagger-jsdoc');

const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema Palmar API',
      version: '1.0.0',
      description: 'API para restaurante, hotel, inventario, pedidos y habitaciones'
    },
    servers: [
      {
        url: serverUrl,
        description: 'Servidor actual'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Usuarios',
        description: 'Gestión de usuarios del sistema'
      },
      {
        name: 'Autenticación',
        description: 'Inicio de sesión y seguridad'
      },
      {
        name: 'Habitaciones',
        description: 'Gestión de habitaciones del hotel'
      },
      {
        name: 'Habitaciones - Imágenes',
        description: 'Gestión de imágenes de habitaciones'
      },
      {
        name: 'Estados de Habitación',
        description: 'Catálogo de estados para habitaciones'
      },
      {
        name: 'Reservaciones',
        description: 'Gestión de reservaciones del hotel'
      },
      {
        name: 'Tarifas',
        description: 'Gestión de tarifas para reservaciones'
      },
      {
        name: 'Inventario',
        description: 'Gestión de inventario del restaurante'
      },
      {
        name: 'Menú',
        description: 'Gestión del menú del restaurante'
      },
      {
        name: 'Órdenes',
        description: 'Gestión de órdenes del restaurante y cocina'
      },
      {
        name: 'Reportes',
        description: 'Reportes financieros del sistema'
      }
    ]
  },
  apis: [
    './src/modules/**/*.js',
    './src/swagger/**/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;