const fs = require('fs');
const path = require('path');

function eliminarArchivoPorRutaAbsoluta(rutaArchivo) {
  if (rutaArchivo && fs.existsSync(rutaArchivo)) {
    fs.unlinkSync(rutaArchivo);
  }
}

function eliminarArchivoPorUrl(imagenUrl) {
  if (!imagenUrl) return;

  const rutaRelativa = imagenUrl.replace(/^\/+/, '');
  const rutaCompleta = path.join(__dirname, '../../', rutaRelativa);

  if (fs.existsSync(rutaCompleta)) {
    fs.unlinkSync(rutaCompleta);
  }
}

module.exports = {
  eliminarArchivoPorRutaAbsoluta,
  eliminarArchivoPorUrl
};