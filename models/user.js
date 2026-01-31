const mongoose = require("mongoose");

//to create the schema import the mongoose schema method
const Schema = mongoose.Schema;

//props needed by our new users
const userSchema = new Schema({
  name: { type: String, required: true }, //unique by mongoose creates an index fr email, but not fully reliable
  email: { type: String, required: true }, //creates a unique index for the email, which speeds up the email querying process faster when in a big database
  password: { type: String, required: true, minlength: 6 }, //sets the min char length to 6
  image: {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  }, //its a Url so its string
  //a user can have mutliple places so add arrayed [] structure to tell mongoose we have mutliple places entries instead of one fr one user.
  places: [{ type: mongoose.Types.ObjectId, required: true, ref: "Place" }],
});
//mongoose 8 and 9 plus doesnt support mongoose-unique-validator
//create explicit email index
userSchema.index({ email: 1 }, { unique: true }); //the method tells mongoDB to create a unique index on the email feild
//make sure index is created even if auto indexing by mongoose fails

module.exports = mongoose.model("User", userSchema);
