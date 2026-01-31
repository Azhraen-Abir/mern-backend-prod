//import the multer
const multer = require("multer");
const { v1: uuidv1 } = require('uuid');
const cloudinary = require("cloudinary").v2;

const MIME_TYPE_MAP = {
  //extension mapper
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

// ✅ Cloudinary config (set these in your environment variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//execute the multer#
const fileUpload = multer({
  //store our extracted image
  limits: {
    fileSize: 5000000 //5000KB
  }, //image size limit
  storage: multer.memoryStorage(), //built in multer storage
fileFilter: (req, file, cb) => { //validate for inavlid files
   const isValid = !!MIME_TYPE_MAP[file.mimetype]; //checks for the valid file entry (!! converts true or false)
   let error = isValid? null: new Error('Invalid mime type!') 
   cb(error, isValid);    
}

}); //fileUpload is the middleware provided by multer

// ✅ Helper: upload multer file -> Cloudinary
// Use in route: const result = await uploadToCloudinary(req.file);
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.buffer) {
      return reject(new Error("No file buffer found. Did you use multer.memoryStorage()?"));
    }

    const ext = MIME_TYPE_MAP[file.mimetype];
    if (!ext) {
      return reject(new Error("Invalid mime type!"));
    }

    const publicId = uuidv1();

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "uploads/images", // change folder if you want
        public_id: publicId,
        resource_type: "image",
        format: ext,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
};

// ✅ Helper: delete from Cloudinary by publicId
// Use in route/controller: await deleteFromCloudinary(publicId);
const deleteFromCloudinary = (publicId) => {
  if (!publicId) return Promise.resolve(null);
  return cloudinary.uploader.destroy(publicId);
};

module.exports = {
  fileUpload, // multer middleware
  uploadToCloudinary, // upload to Cloudinary
  deleteFromCloudinary, // delete from Cloudinary
};
