// const fs = require("fs");
// const { v4: uuid } = require("uuid"); //import uuid
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../middleware/file-upload");

const HttpError = require("../models/http-error"); //we are using it here too so import it
const getCoordsForAddress = require("../util/location");
//import our place model#
const Place = require("../models/places");
//to interact with the user, we need the User model here
const User = require("../models/user");

//get the place by the PlaceID or object id of the place object
const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid; //params => {pid: 'p1'} returns exact pid value

  let place; //since place is block scope we need gto define it outside the scope

  //use my place model and fetch the place from the Database
  try {
    place = await Place.findById(placeId); //find place by the id extracted from the req body
  } catch (err) {
    //if some error happens while fetching from Database, basically our Get req has some issue
    const error = new HttpError(
      "Something went wrong,could not find a place",
      500,
    );
    return next(error); //stop the execution if error happens
  }

  //if place is not found for the specific id in the Database, since place is obj, mongoose returns null, single document case
  if (!place) {
    //status is a method by default its 200, if want to change then call it
    return next(
      new HttpError("Could not find a place for the given place-id.", 404),
    ); //forward to error handler middleware
  }

  res.json({ place: place.toObject({ getters: true }) }); //convert the mongoose specific Place obj to normal Js obj using method, and ID getter by mongoose in every doc, returns the ID as String
};
//get a specific place for the userId from the Database.
const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  //let places;//Blocked scope, so need to let it outside the try/catch block
  let userWithPlaces;
  //fetching or GET request might throw an error and since finding the place is an async task
  try {
    //places = await Place.find({creator: userId});//find specific place by userId, by filtering creator(prop) = userId
    userWithPlaces = await User.findById(userId).populate("places"); //search fr a specific userId and then get access to the corressponding places a user has
  } catch (err) {
    //if error when GET req is given to the Database
    const error = new HttpError(
      "Could not find a place for the provided id, try again later.",
      500,
    );
    return next(error); //stop if error; code 500 means smthin went wrong in the request
  }
  //if the array is empty, we are checking for multiple documents
  //if no places match the userId, mongoose return empty array of length 0
  if (userWithPlaces.places.length === 0) {
    //status is a method by default its 200, if want to change then call it
    return next(
      new HttpError("Could not find a places for the given user-id.", 404),
    );
  }
  //getters make sure the _id is turned to id and becomes a String
  res.json({
    places: userWithPlaces.places.map((place) =>
      place.toObject({ getters: true }),
    ),
  }); //maps the array one by one using each element and turns them into an obj using toObj inside its argument function
};
//create new place in the Database using my place model
const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  //check if errors is not empty/we have some errors so we go into if block
  if (!errors.isEmpty()) {
    console.log(errors); //log the extra error data into the console
    return next(
      new HttpError("Invalid inputs detected, please try again!", 422),
    );
  }

  //extract the req body props from the json data in frontend except the creator, we get the require cant be faked userId frm check-auth userData
  const { title, description, address } = req.body; //object destructuring to get props out of req body and store them in const inside the fucntion.
  //convert address to coordinates an get them here
  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error); //forward to next midware since async f cant throw error properly and quit the execution usin return
  }

  if (!req.file) {
    return next(new HttpError("Please upload an image.", 422));
  }

  let uploadedImage;
  try {
    uploadedImage = await uploadToCloudinary(req.file);
  } catch (err) {
    return next(new HttpError("Image upload failed, please try again.", 500));
  }

  //new place creation model
  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates, //as found from the geocode API
    image: {
      url: uploadedImage.secure_url,
      publicId: uploadedImage.public_id,
    },
    creator: req.userData.userId, //use the userId gotten frm check-auth, cz frontend creator id can be faked, so omitt it
  });
  //check if the provided userid exists already or not, if yes then create place for that user
  let existingUser;

  try {
    //from req body check userId already exits or not
    existingUser = await User.findById(req.userData.userId);
  } catch (err) {
    //if server fails
    console.error(err);
    return next(new HttpError("Creating place failed, please try again.", 500));
  }

  //if the userid/creatorId or the user is not in my Database
  if (!existingUser) {
    return next(new HttpError("Could not find user for provided id", 404));
  }

  //might throw error and async task so need try catch
  try {
    const sess = await mongoose.startSession(); //start my session with the method provided by mongoose
    sess.startTransaction(); //start my transaction in my current session
    await createdPlace.save({ session: sess });
    existingUser.places.push(createdPlace); //existingUser is the user doc fetched using findById() and places is the field in the user doc/ or in Schema basically.
    //here push() becomes a mongoose specific method,establishing connection between my referred models,and adds the placeId to the places feild of the user.
    await existingUser.save({ session: sess }); //save the updated exisitngUser
    await sess.commitTransaction(); //end the session and get the transactions finalized as outputs
  } catch (err) {
    const error = new HttpError(
      "Creating new place failed, plaese try again.",
      500,
    );

    return next(error); //stop the code execution if error found
  }
  res.status(201).json({ place: createdPlace }); //return the created place by the user
};

//update the place by placeId from the Database
const updatePlace = async (req, res, next) => {
  //check for errors, using in built validation by 'express-validator'
  const errors = validationResult(req);
  //if not error exists
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid data input, provide valid data", 422));
  }

  //extract only title and description from patch req body
  const { title, description } = req.body; //use to obj destructure to extract
  const placeId = req.params.pid; //parse the id of the place encoded in Url, which needs to be updated.

  let place;
  try {
    //findById return an object so place is a mongoose object
    place = await Place.findById(placeId); //find by using the placeId extracted from the req body
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place.",
      500,
    );
    return next(error); //stop execution
  }
  //NOTE: the creator ID is special ID type only mongoose knows, so need to convert it to String to make the check
  //the place has the creatorId field, check to verify the exact crator requested for update
  if (place.creator.toString() != req.userData.userId) {
    //this user isnt the creator of this place
    return next(
      new HttpError("You are not allowed to make changes to this place.", 401),
    ); //401 cz auth error
  }
  //change only allowed, if the if check ie the creator was found.=>

  //update my place object..
  place.title = title; //found from the req.body
  place.description = description; //const stores the address of the object not the object itself found from obj destructure above

  try {
    //store the updated place
    await place.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place.",
      500,
    );
    return next(error); //stop execution
  }
  res.status(200).json({ place: place.toObject({ getters: true }) });
};
//delete a place by the placeId from the Database
const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid; //get the place id

  let place;
  try {
    //populate lets us access the user doc in the places-controller, and creator gets the user by the id, making it for us to delete
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find the place.",
      500,
    );
    return next(error); //stop execution
  }
  //if doc doesnt exit mongoose returns null, if place is null or no place is found by the placeId
  if (!place) {
    //since its single doc we check null
    return next(new HttpError("Could not find a place for the given id.", 404));
  }
  //after finding a place make sure the place was really created by the requester user
  //since creator holds the full user obj to access the id we need to do nested access
  if (place.creator.id != req.userData.userId) {
    return next(new HttpError("You are not allowed to delete this place", 401)); //auth error so 401
  }

  //store the image path to delete the image from the backend
  const publicId = place.image.publicId;

  //remove the place by using deleteOne() method by mongoose
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction(); //start the transaction
    await place.deleteOne({ session: sess }); //remove the place from our places collection
    //access the place stored in the creator(prop)
    await place.creator.places.pull(place); //remove the specific place from the places array, and also delete the ID, all done by pull().
    // save the newly created user
    await place.creator.save({ session: sess });
    //if all success end the session and confirm transaction
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place.",
      500,
    );
    return next(error); //stop execution
  }
  //delete the image if errs doesnt really matter xd
  try {
  await deleteFromCloudinary(publicId);
} catch (err) {
  console.log("Cloudinary delete failed:", err.message);
}

  //removing wont give back any document so the response stays the same.
  res.status(200).json({ message: "Deleted place." });
};

exports.getPlaceById = getPlaceById; //export our func pointer
exports.getPlacesByUserId = getPlacesByUserId; //dont put () we just pass the pointer to the func not execute it
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
