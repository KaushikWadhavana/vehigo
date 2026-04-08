const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (file, folder) => {
  return new Promise((resolve, reject) => {

    const isDocument =
      file.mimetype === "application/pdf" ||
      file.mimetype.includes("msword") ||
      file.mimetype.includes("officedocument");

    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: isDocument ? "raw" : "image",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      )
      .end(file.buffer);
  });
};

module.exports = uploadToCloudinary;