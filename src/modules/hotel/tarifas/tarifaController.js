const Tarifa = require('../../../models/Tarifa');

async function crearTarifa(req, res) {
  try {
    const {
      nombre,
      descripcion,
      precio,
      precio_adulto_extra,
      precio_nino_extra,
      desayunos_incluidos,
      almuerzos_incluidos,
      cenas_incluidas
    } = req.body;

    if (!nombre || precio === undefined || precio === null || precio === '') {
      return res.status(400).json({
        mensaje: 'nombre y precio son obligatorios'
      });
    }

    if (Number(precio) <= 0) {
      return res.status(400).json({
        mensaje: 'precio debe ser mayor a 0'
      });
    }

    const tarifa = await Tarifa.create({
      nombre,
      descripcion: descripcion || null,
      precio,
      precio_adulto_extra: precio_adulto_extra !== undefined ? precio_adulto_extra : 100,
      precio_nino_extra: precio_nino_extra !== undefined ? precio_nino_extra : 50,
      desayunos_incluidos: desayunos_incluidos !== undefined ? desayunos_incluidos : 0,
      almuerzos_incluidos: almuerzos_incluidos !== undefined ? almuerzos_incluidos : 0,
      cenas_incluidas: cenas_incluidas !== undefined ? cenas_incluidas : 0,
      fecha_creacion: new Date(),
      fecha_actualizacion: null
    });

    return res.status(201).json({
      mensaje: 'Tarifa creada correctamente',
      tarifa
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al crear tarifa'
    });
  }
}

async function listarTarifas(req, res) {
  try {
    const tarifas = await Tarifa.findAll({
      order: [['id', 'DESC']]
    });

    return res.json({
      mensaje: 'Tarifas obtenidas correctamente',
      tarifas
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al listar tarifas'
    });
  }
}

async function editarTarifa(req, res) {
  try {
    const { id } = req.params;

    const {
      nombre,
      descripcion,
      precio,
      precio_adulto_extra,
      precio_nino_extra,
      desayunos_incluidos,
      almuerzos_incluidos,
      cenas_incluidas
    } = req.body;

    const tarifa = await Tarifa.findByPk(id);

    if (!tarifa) {
      return res.status(404).json({
        mensaje: 'Tarifa no encontrada'
      });
    }

    if (nombre !== undefined) {
      tarifa.nombre = nombre;
    }

    if (descripcion !== undefined) {
      tarifa.descripcion = descripcion || null;
    }

    if (precio !== undefined) {
      if (Number(precio) <= 0) {
        return res.status(400).json({
          mensaje: 'precio debe ser mayor a 0'
        });
      }

      tarifa.precio = precio;
    }

    if (precio_adulto_extra !== undefined) {
      tarifa.precio_adulto_extra = precio_adulto_extra;
    }

    if (precio_nino_extra !== undefined) {
      tarifa.precio_nino_extra = precio_nino_extra;
    }

    if (desayunos_incluidos !== undefined) {
      tarifa.desayunos_incluidos = desayunos_incluidos;
    }

    if (almuerzos_incluidos !== undefined) {
      tarifa.almuerzos_incluidos = almuerzos_incluidos;
    }

    if (cenas_incluidas !== undefined) {
      tarifa.cenas_incluidas = cenas_incluidas;
    }

    tarifa.fecha_actualizacion = new Date();

    await tarifa.save();

    return res.json({
      mensaje: 'Tarifa actualizada correctamente',
      tarifa
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al actualizar tarifa'
    });
  }
}

async function eliminarTarifa(req, res) {
  try {
    const { id } = req.params;

    const tarifa = await Tarifa.findByPk(id);

    if (!tarifa) {
      return res.status(404).json({
        mensaje: 'Tarifa no encontrada'
      });
    }

    await tarifa.destroy();

    return res.json({
      mensaje: 'Tarifa eliminada correctamente'
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al eliminar tarifa. Puede que la tarifa esté asociada a una reservación.'
    });
  }
}

module.exports = {
  crearTarifa,
  listarTarifas,
  editarTarifa,
  eliminarTarifa
};