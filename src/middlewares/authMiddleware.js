const jwt = require('jsonwebtoken');

const ROLES = {
  MANAGER: 1,
  EMPLEADO: 2,
  COCINA: 3
};

function verificarToken(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        mensaje: 'Token no enviado'
      });
    }

    if (!authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        mensaje: 'Formato de token inválido. Use Bearer token'
      });
    }

    const token = authorization.split(' ')[1];

    const usuarioDecodificado = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.usuario = usuarioDecodificado;

    return next();
  } catch (error) {
    return res.status(401).json({
      mensaje: 'Token inválido o expirado'
    });
  }
}

function autorizarRoles(...rolesPermitidos) {
  return (req, res, next) => {
    const usuario = req.usuario;

    if (!usuario) {
      return res.status(401).json({
        mensaje: 'Usuario no autenticado'
      });
    }

    const rolId = Number(
      usuario.rol_id ||
      usuario.rolId ||
      usuario.rol
    );

    if (!rolesPermitidos.includes(rolId)) {
      return res.status(403).json({
        mensaje: 'No tiene permisos para ejecutar esta acción'
      });
    }

    return next();
  };
}

module.exports = {
  verificarToken,
  autorizarRoles,
  ROLES
};