const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.uploadBuffer = (buffer, folder = "ups-battery-store/avatars") =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => (error ? reject(error) : resolve(result)),
    );
    stream.end(buffer);
  });

exports.deleteImage = (publicId) =>
  cloudinary.uploader.destroy(publicId, { resource_type: "image" });
