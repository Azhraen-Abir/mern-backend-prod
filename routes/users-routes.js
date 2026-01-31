//set up middlewares for users reqs
const express = require("express"); //if need express in seperate files import needed
//import only the check method here cz we only need the check method so we use the object destructure for this
const { check } = require("express-validator");

const usersController = require("../controllers/users-controller");
const { fileUpload } = require("../middleware/file-upload");

//the router method retuns an object
const router = express.Router();
//reteive all the users in the web
router.get("/", usersController.getUsers);
//new user sets data to signup
router.post(
  "/signup",
  fileUpload.single("image"), //single() retrieves a single file, the name(image) expected in the body of the req that holds the image
  [
    check("name").not().isEmpty(),
    check("email")
      .normalizeEmail() // turns Abc@gmail.com => abc@gmail.com
      .isEmail(), //checks if its an email or not
    check("password").isLength({ min: 6 }),
  ],
  usersController.signup,
);
//login for existing user
router.post("/login", usersController.login);

module.exports = router;
