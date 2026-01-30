//middlware to validate incoomin reqs for it's token
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {
  //handle the default browser OPTIONS req (for premission to backend)
  if (req.method === "OPTIONS") {
    return next(); //allows the OPTIONS req to continue and reach the Backend
  }

  //the auth.. header might not be set, it will crash then so set try catch
  try {
    //check whether we have a VALID TOKEN or not
    //extract the incommin Token by accessing the Authorization header.
    //The received header is Authorization : 'Bearer TOKEN', indicates that this req bears a TOEKN, split it in the space and access the TOKEN or arr[1]
    const token = req.headers.authorization.split(" ")[1]; //headers provided auto by expressjs, in app js Auth.. header is allowed to be set by fEnd

    //if the TOKEN is not found.
    if (!token) {
      //stop execution
      throw new HttpError("Authentication failed!"); //doesnt matter to much cz catch has error handle
    }
    //Now we do have a TOKEN but it might be Invalid
    //verify returns an object with the payload data(we stored the userId and email there)
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    //if the verification didnt fail, the user is Authenticated cz the TOKEN matches

    //dynmically add extracted userId, so every req after thiscan use userData and get the userId.
    req.userData = { userId: decodedToken.userId };
    next(); //allow the req to continue, so that it reaches routes that require Authentication
  } catch (err) {//no Valid token
    //if verification fails
    const error = new HttpError("Authentication failed!", 403); //403: UNAUTHORIZED(Forbidden)
    return next(error);
  }
};
