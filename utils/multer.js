const multer = require("multer");
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (/^image\/(jpeg|png|webp)$/.test(file.mimetype)) return cb(null, true);
  return cb(new Error("Unsupported file type"), false);
};
module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
