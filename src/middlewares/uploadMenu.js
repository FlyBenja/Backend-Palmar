const multer = require('multer');
const path = require('path');
const fs = require('fs');

const carpetaMenu = path.join(__dirname, '../../uploads/menu');

if (!fs.existsSync(carpetaMenu)) {
  fs.mkdirSync(carpetaMenu, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, carpetaMenu);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const nombreArchivo = `menu-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

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

const uploadMenu = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

module.exports = uploadMenu;
