const multer = require('multer');
const path = require('path');
const fs = require('fs');

const carpetaHabitaciones = path.join(__dirname, '../../uploads/habitaciones');

if (!fs.existsSync(carpetaHabitaciones)) {
  fs.mkdirSync(carpetaHabitaciones, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, carpetaHabitaciones);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const nombreArchivo = `habitacion-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

    cb(null, nombreArchivo);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

const uploadHabitacion = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

module.exports = uploadHabitacion;