const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs"); //helps with hashing passwords
const jwt = require("jsonwebtoken"); //import the jsonwebtoken

const HttpError = require("../models/http-error");
const User = require("../models/user"); // use capital for the const name cz its a constructor func

const getUsers = async (req, res, next) => {
  //getting users might cause an error

  let users;

  try {
    users = await User.find({}, "-password");//exclude the password
  } catch (err) {
    //if find method fails
    return next(
      new HttpError("Fetching users failed, please try again later.", 500),
    );
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req); //check for errors
  //if errors exist go into if block
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid signup info, please provide valid inputs.", 422),
    );
  }

  //new user creation needed
  //extract data from the request body
  const { name, email, password } = req.body;

  //the error msg we get from index() is quite technical so we create a manual validation logic
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email }); //finds one document, matching the crteria in the arg of the method
  } catch (err) {
    //if the findOne method doesnt work as intended or errors throw error
    const error = new HttpError(
      "Sign up failed, please try again later .",
      500,
    );
    return next(error); //stop execution if error found
  }

  //if e find a existing user email then and stop the code execution
  if (existingUser) {
    return next(
      new HttpError("User exists already, please login instead", 422),
    );
  }

  //generate hashed pass
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      "Could not create user, please try again.",
      500,
    );
    return next(error);
  }

  //create a user
  const createdUser = new User({
    name,
    email,
    image: req.file.path, //file, path both given my multer, path contains the exact loaction of img defined in backend (uploads/images/file-name)
    password: hashedPassword, //store the hashed password
    places: [], //starting value is an empty array, later new created places will fill up this array.
  });

  try {
    //save() saves the Document in the atlas and also gives the unique place id
    await createdUser.save(); //async
  } catch (err) {
    const error = new HttpError("Signing up failed, plaese try again.", 500);

    return next(error); //stop the code execution if error found
  }

  //the user is now a valid user anf generate a token for the user can fail even tho dsnt return promise so wrap in trycatch
  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" },
    ); //set the expiration option as extra security
  } catch (err) {
    const error = new HttpError("Signing up failed, plaese try again.", 500);
    return next(error);
  }
  //we now have a token and now we can return the token as part of the data I want to send back
  res
    .status(200)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
};

const login = async (req, res, next) => {
  //extract data from the request body
  const { email, password } = req.body;

  //check for existing email logic
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email }); //finds one document, matching the crteria in the arg of the method
  } catch (err) {
    //if the findOne method doesnt work as intended or errors throw error
    const error = new HttpError(
      "Logging in failed, please try again later .",
      500,
    );
    return next(error); //stop execution if error found
  }

  //if existingUser is not stored in the Database
  if (!existingUser) {
    return next(
      new HttpError("Invalid credentials could not log you in.", 403), //403: UNAUTHORIZED(Forbidden)
    );
  }

  //if we do find a user in the Database
  let isValidPassword = false; //initially false
  try {
    //plain req pass   hashed password
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      "Could not log you in, please check your credentials and try again.",
      500,
    );
    return next(error);
  }

  //if isValidPassword is false
  if (!isValidPassword) {
    return next(
      new HttpError("Invalid credentials could not log you in.", 403),//403: UNAUTHORIZED(Forbidden)
    );
  }

  //email exists and the password is correct and generate the TOKEN
  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" },
    ); //set the expiration option as extra security
  } catch (err) {
    const error = new HttpError("Logging in failed, plaese try again.", 500);
    return next(error);
  }

  res
    .status(200)
    .json({ userId: existingUser.id, email: existingUser.email, token: token });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
