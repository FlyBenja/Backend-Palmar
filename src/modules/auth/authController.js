const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Usuario = require('../../models/Usuario');

async function login(req, res) {
  try {
    const { correo, contrasenia } = req.body;

    if (!correo || !contrasenia) {
      return res.status(400).json({
        mensaje: 'Correo y contraseña son obligatorios'
      });
    }

    const usuario = await Usuario.findOne({
      where: {
        correo,
        estado: true
      }
    });

    if (!usuario) {
      return res.status(401).json({
        mensaje: 'Credenciales incorrectas'
      });
    }

    const contraseniaValida = await bcrypt.compare(
      contrasenia,
      usuario.contrasenia_hash
    );

    if (!contraseniaValida) {
      return res.status(401).json({
        mensaje: 'Credenciales incorrectas'
      });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol_id: usuario.rol_id
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '8h'
      }
    );

    return res.json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: usuario.id,
        rol_id: usuario.rol_id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        telefono: usuario.telefono
      }
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al iniciar sesión'
    });
  }
}

module.exports = {
  login
};