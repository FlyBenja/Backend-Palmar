/**
 * @swagger
 * /api/inventario/categorias:
 *   get:
 *     summary: Listar categorías de inventario
 *     tags:
 *       - Inventario
 *     description: Lista las categorías de inventario. Solo manager.
 *     responses:
 *       200:
 *         description: Categorías de inventario obtenidas correctamente
 *       401:
 *         description: Token no enviado o inválido
 *       403:
 *         description: No tiene permisos
 *
 *   post:
 *     summary: Crear categoría de inventario
 *     tags:
 *       - Inventario
 *     description: Crea una categoría para productos de inventario. Solo manager.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Carnes"
 *               descripcion:
 *                 type: string
 *                 example: "Productos cárnicos para cocina"
 *     responses:
 *       201:
 *         description: Categoría de inventario creada correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no enviado o inválido
 *       403:
 *         description: No tiene permisos
 */

/**
 * @swagger
 * /api/inventario/categorias/{id}:
 *   patch:
 *     summary: Editar categoría de inventario
 *     tags:
 *       - Inventario
 *     description: Edita una categoría de inventario. Solo manager.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Carnes y embutidos"
 *               descripcion:
 *                 type: string
 *                 example: "Productos para cocina"
 *               estado:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Categoría de inventario actualizada correctamente
 *       401:
 *         description: Token no enviado o inválido
 *       403:
 *         description: No tiene permisos
 *       404:
 *         description: Categoría no encontrada
 */

/**
 * @swagger
 * /api/inventario/productos:
 *   get:
 *     summary: Listar productos de inventario
 *     tags:
 *       - Inventario
 *     description: Lista productos de inventario. Solo manager.
 *     parameters:
 *       - in: query
 *         name: categoria_id
 *         schema:
 *           type: integer
 *         required: false
 *         description: Filtrar por categoría
 *       - in: query
 *         name: bajo_stock
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Filtrar productos con bajo stock
 *     responses:
 *       200:
 *         description: Productos de inventario obtenidos correctamente
 *
 *   post:
 *     summary: Crear producto de inventario
 *     tags:
 *       - Inventario
 *     description: Crea un producto de inventario. Solo manager.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoria_id
 *               - nombre
 *               - unidad_medida
 *               - stock_actual
 *               - stock_minimo
 *               - costo_unitario
 *             properties:
 *               categoria_id:
 *                 type: integer
 *                 example: 1
 *               nombre:
 *                 type: string
 *                 example: "Pollo"
 *               unidad_medida:
 *                 type: string
 *                 example: "lb"
 *               stock_actual:
 *                 type: number
 *                 example: 25
 *               stock_minimo:
 *                 type: number
 *                 example: 5
 *               costo_unitario:
 *                 type: number
 *                 example: 18.5
 *     responses:
 *       201:
 *         description: Producto de inventario creado correctamente
 */

/**
 * @swagger
 * /api/inventario/productos/{id}:
 *   patch:
 *     summary: Editar producto de inventario
 *     tags:
 *       - Inventario
 *     description: Edita un producto de inventario. Solo manager.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoria_id:
 *                 type: integer
 *                 example: 1
 *               nombre:
 *                 type: string
 *                 example: "Pollo premium"
 *               unidad_medida:
 *                 type: string
 *                 example: "lb"
 *               stock_minimo:
 *                 type: number
 *                 example: 10
 *               costo_unitario:
 *                 type: number
 *                 example: 20
 *               estado:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Producto actualizado correctamente
 */

/**
 * @swagger
 * /api/inventario/movimientos:
 *   get:
 *     summary: Listar movimientos de inventario
 *     tags:
 *       - Inventario
 *     description: Lista movimientos de inventario. Solo manager.
 *     responses:
 *       200:
 *         description: Movimientos obtenidos correctamente
 *
 *   post:
 *     summary: Crear movimiento de inventario
 *     tags:
 *       - Inventario
 *     description: Crea un movimiento de entrada, salida o ajuste. Solo manager.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - producto_inventario_id
 *               - tipo_movimiento
 *               - cantidad
 *             properties:
 *               producto_inventario_id:
 *                 type: integer
 *                 example: 1
 *               tipo_movimiento:
 *                 type: string
 *                 example: "ENTRADA"
 *               cantidad:
 *                 type: number
 *                 example: 10
 *               costo_unitario:
 *                 type: number
 *                 example: 18.5
 *               referencia_tipo:
 *                 type: string
 *                 example: "COMPRA"
 *               referencia_id:
 *                 type: integer
 *                 example: 1
 *               observacion:
 *                 type: string
 *                 example: "Ingreso de producto"
 *     responses:
 *       201:
 *         description: Movimiento creado correctamente
 */

/**
 * @swagger
 * /api/menu/categorias:
 *   get:
 *     summary: Listar categorías del menú
 *     tags:
 *       - Menú
 *     description: Lista las categorías del menú. Manager y empleado.
 *     responses:
 *       200:
 *         description: Categorías del menú obtenidas correctamente
 *
 *   post:
 *     summary: Crear categoría del menú
 *     tags:
 *       - Menú
 *     description: Crea una categoría para el menú. Solo manager.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Desayunos"
 *               descripcion:
 *                 type: string
 *                 example: "Platillos disponibles por la mañana"
 *     responses:
 *       201:
 *         description: Categoría del menú creada correctamente
 */

/**
 * @swagger
 * /api/menu/categorias/{id}:
 *   patch:
 *     summary: Editar categoría del menú
 *     tags:
 *       - Menú
 *     description: Edita una categoría del menú. Solo manager.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Desayunos especiales"
 *               descripcion:
 *                 type: string
 *                 example: "Platillos de desayuno"
 *               estado:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Categoría del menú actualizada correctamente
 */

/**
 * @swagger
 * /api/menu/items:
 *   get:
 *     summary: Listar productos del menú
 *     tags:
 *       - Menú
 *     description: Lista los productos o platillos del menú. Manager y empleado.
 *     responses:
 *       200:
 *         description: Items del menú obtenidos correctamente
 *
 *   post:
 *     summary: Crear producto del menú
 *     tags:
 *       - Menú
 *     description: Crea un platillo o producto del menú. Solo manager.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoria_menu_id
 *               - nombre
 *               - precio
 *             properties:
 *               categoria_menu_id:
 *                 type: integer
 *                 example: 1
 *               nombre:
 *                 type: string
 *                 example: "Desayuno chapín"
 *               descripcion:
 *                 type: string
 *                 example: "Huevos, frijoles, plátanos y queso"
 *               precio:
 *                 type: number
 *                 example: 45
 *               estado:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Item del menú creado correctamente
 */

/**
 * @swagger
 * /api/menu/items/{id}:
 *   patch:
 *     summary: Editar producto del menú
 *     tags:
 *       - Menú
 *     description: Edita un producto o platillo del menú. Solo manager.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoria_menu_id:
 *                 type: integer
 *                 example: 1
 *               nombre:
 *                 type: string
 *                 example: "Desayuno chapín grande"
 *               descripcion:
 *                 type: string
 *                 example: "Desayuno con bebida incluida"
 *               precio:
 *                 type: number
 *                 example: 55
 *               estado:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Item del menú actualizado correctamente
 */

/**
 * @swagger
 * /api/ordenes:
 *   post:
 *     summary: Crear orden
 *     tags:
 *       - Órdenes
 *     description: Crea una orden del restaurante. Manager y empleado.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               reservacion_id:
 *                 type: integer
 *                 example: 1
 *               nombre_cliente:
 *                 type: string
 *                 example: "Juan Pérez"
 *               observacion:
 *                 type: string
 *                 example: "Sin cebolla"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     menu_item_id:
 *                       type: integer
 *                       example: 1
 *                     cantidad:
 *                       type: integer
 *                       example: 2
 *     responses:
 *       201:
 *         description: Orden creada correctamente
 *
 *   get:
 *     summary: Listar órdenes
 *     tags:
 *       - Órdenes
 *     description: Lista órdenes del restaurante. Manager y empleado.
 *     responses:
 *       200:
 *         description: Órdenes obtenidas correctamente
 */

/**
 * @swagger
 * /api/ordenes/cocina/hoy:
 *   get:
 *     summary: Listar órdenes de cocina del día
 *     tags:
 *       - Órdenes
 *     description: Lista las órdenes creadas durante el día para cocina. Solo rol cocina.
 *     responses:
 *       200:
 *         description: Órdenes de cocina obtenidas correctamente
 */

/**
 * @swagger
 * /api/ordenes/{id}/estado:
 *   patch:
 *     summary: Actualizar estado de orden
 *     tags:
 *       - Órdenes
 *     description: Actualiza el estado general de una orden.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estado
 *             properties:
 *               estado:
 *                 type: string
 *                 example: "EN_PREPARACION"
 *     responses:
 *       200:
 *         description: Estado de orden actualizado correctamente
 */

/**
 * @swagger
 * /api/ordenes/detalles/{detalleId}/estado-cocina:
 *   patch:
 *     summary: Actualizar estado de detalle en cocina
 *     tags:
 *       - Órdenes
 *     description: Actualiza el estado de un detalle de orden desde cocina.
 *     parameters:
 *       - in: path
 *         name: detalleId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estado_cocina
 *             properties:
 *               estado_cocina:
 *                 type: string
 *                 example: "LISTO"
 *     responses:
 *       200:
 *         description: Estado del detalle actualizado correctamente
 */

/**
 * @swagger
 * /api/reportes/financiero/dia:
 *   get:
 *     summary: Reporte financiero por día
 *     tags:
 *       - Reportes
 *     description: Obtiene el reporte financiero de un día específico. Solo manager.
 *     parameters:
 *       - in: query
 *         name: fecha
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-06-24"
 *     responses:
 *       200:
 *         description: Reporte financiero diario obtenido correctamente
 */

/**
 * @swagger
 * /api/reportes/financiero/mes:
 *   get:
 *     summary: Reporte financiero por mes
 *     tags:
 *       - Reportes
 *     description: Obtiene el reporte financiero mensual. Solo manager.
 *     parameters:
 *       - in: query
 *         name: anio
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2026
 *       - in: query
 *         name: mes
 *         required: true
 *         schema:
 *           type: integer
 *         example: 6
 *     responses:
 *       200:
 *         description: Reporte financiero mensual obtenido correctamente
 */