//import the multer
const multer = require("multer");
const { v1: uuidv1 } = require('uuid');

const MIME_TYPE_MAP = {
  //extension mapper
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

//execute the multer#
const fileUpload = multer({
  //store our extracted image
  limits: {
    fileSize: 5000000 //5000KB
  }, //image size limit
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/images');
    }, //store destination , cb is the callbback func
    filename: (req, file, cb) => {
      //extract the extension of the incomming file
      const ext = MIME_TYPE_MAP[file.mimetype]; //file is the obj given by multer and mimetype has the file extension
    cb(null, uuidv1() + '.' + ext) //generate a random file with right ext
    
    }, //name od the file
  }), //built in multer storage
fileFilter: (req, file, cb) => { //validate for inavlid files
   const isValid = !!MIME_TYPE_MAP[file.mimetype]; //checks for the valid file entry (!! converts true or false)
   let error = isValid? null: new Error('Invalid mime type!') 
   cb(error, isValid);    
}

}); //fileUpload is the middleware provided by multer

module.exports = fileUpload;
