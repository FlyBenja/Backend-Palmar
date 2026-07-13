const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

const Usuario = require('../../models/Usuario');

async function crearUsuario(req, res) {
  try {
    const {
      rol_id,
      nombre,
      correo,
      contrasenia,
      telefono
    } = req.body;

    if (!rol_id || !nombre || !correo || !contrasenia) {
      return res.status(400).json({
        mensaje: 'rol_id, nombre, correo y contrasenia son obligatorios'
      });
    }

    const usuarioExiste = await Usuario.findOne({
      where: {
        correo
      }
    });

    if (usuarioExiste) {
      return res.status(409).json({
        mensaje: 'El correo ya está registrado'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const contraseniaHash = await bcrypt.hash(contrasenia, salt);

    const usuario = await Usuario.create({
      rol_id,
      nombre,
      correo,
      contrasenia_hash: contraseniaHash,
      telefono: telefono || null,
      estado: true,
      fecha_creacion: new Date(),
      fecha_actualizacion: null
    });

    return res.status(201).json({
      mensaje: 'Usuario creado correctamente',
      usuario: {
        id: usuario.id,
        rol_id: usuario.rol_id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        telefono: usuario.telefono,
        estado: usuario.estado,
        fecha_creacion: usuario.fecha_creacion,
        fecha_actualizacion: usuario.fecha_actualizacion
      }
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al crear usuario'
    });
  }
}

async function editarCredencialesUsuario(req, res) {
  try {
    const { id } = req.params;

    const {
      correo,
      contrasenia
    } = req.body;

    if (!correo && !contrasenia) {
      return res.status(400).json({
        mensaje: 'Debe enviar correo o contrasenia para actualizar'
      });
    }

    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado'
      });
    }

    if (correo !== undefined && correo !== null && correo !== '') {
      if (correo !== usuario.correo) {
        const correoExiste = await Usuario.findOne({
          where: {
            correo,
            id: {
              [Op.ne]: id
            }
          }
        });

        if (correoExiste) {
          return res.status(409).json({
            mensaje: 'El correo ya está en uso'
          });
        }

        usuario.correo = correo;
      }
    }

    if (contrasenia !== undefined && contrasenia !== null && contrasenia !== '') {
      const salt = await bcrypt.genSalt(10);
      usuario.contrasenia_hash = await bcrypt.hash(contrasenia, salt);
    }

    usuario.fecha_actualizacion = new Date();

    await usuario.save();

    return res.json({
      mensaje: 'Credenciales actualizadas correctamente',
      usuario: {
        id: usuario.id,
        rol_id: usuario.rol_id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        telefono: usuario.telefono,
        estado: usuario.estado,
        fecha_creacion: usuario.fecha_creacion,
        fecha_actualizacion: usuario.fecha_actualizacion
      }
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al actualizar credenciales'
    });
  }
}

module.exports = {
  crearUsuario,
  editarCredencialesUsuario
};