//set up middlewares for places reqs
const express = require("express"); //if need express in seperate files import needed
//import only the check method here cz we only need the check method so we use the object destructure for this
const { check } = require("express-validator");
const {fileUpload} = require('../middleware/file-upload')//multer middleware
const checkAuth = require('../middleware/check-auth')
const placesControllers = require("../controllers/places-controllers");

const router = express.Router();
//PUBLIC routes
//the router method retuns an object
router.get("/:pid", placesControllers.getPlaceById);

router.get("/user/:uid", placesControllers.getPlacesByUserId);

//middleware are executed top to bottom so adding the protection middlware here, ensures 1st 2 routes are open to all
//send back an err response if the incommin req has no valid TOKEN this is the job of this middleware
router.use(checkAuth);//point at the func, so it registered by express as a middleware

//Only valid tokened(Authenticated by checkAuth) req reaches these bottom routes
//PROTECTED Routes
//can register multiple middlewares in the same Http method
router.post(
  "/",
  fileUpload.single('image'),
  [check("title").not().isEmpty(),
    check('description').isLength({min: 5}),
    check('address').not().isEmpty()
  ],
  placesControllers.createPlace
);
//doesnt clash with route of :pid cz thats get and its patch
router.patch("/:pid",[
    check('title').not().isEmpty(),
    check('description').isLength({min:5}) 
], placesControllers.updatePlace);

router.delete("/:pid", placesControllers.deletePlace);

module.exports = router;
