const fs = require("fs"); //allows the interaction between files
const path = require("path"); //absolute file path built into node as path module.
const express = require("express");
const bodyParser = require("body-parser");
//import mongoose
const mongoose = require("mongoose");

const placesRoutes = require("./routes/places-routes"); //imported middleware
const usersRoutes = require("./routes/users-routes"); //import the users routes
const HttpError = require("./models/http-error");

const app = express();

//middlwares
//...
//we parse any req body and extract any json data in there, which we will need for backend
app.use(bodyParser.json()); //.json also adds next auto and passes parsed data to next middleware

//a middleware to access the images, for the request of the FrontEnd, cz no code is accessable without middleware filter
app.use("/uploads/images", express.static(path.join("uploads", "images"))); //this returns a special middleware and static() returns the file, by taking the absolute path as an argument

//add a middleware that adds a header to every responses sent to the browser/frontend, to avoid CORS error
app.use((req, res, next) => {
  //specify the domain and add headers to the response for the browser to handle
  res.setHeader("Access-Control-Allow-Origin", "*"); //star is the specified domain, * it means any dom, but we could specify to localhost: 3000(Our Backend)
  //specify which headers, the reqs sent by the Browser may have, (Allow headers controls which headers incomming reqs may have so they are handled)
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  //specify which HTTP verbs/methods may be used on the frontend, and allow them
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next(); //forward the response to the below specific routes
});

app.use("/api/places", placesRoutes); //becomes a middleware exported from outside
//this will take place only if the path starts with /api/places, it just appends this filter with placesRoutes own dynamic filter

//users dynamic path filter and forwards to my usersRoutes file
app.use("/api/users", usersRoutes);

//middleware who is reached only when a req didnt get a response frm the routes, for reqs we dont want to handle
app.use((req, res, next) => {
  const error = new HttpError("Bhul route disen mara khan.", 404);
  next(error);
});

//error model default
app.use((error, req, res, next) => {
  //default prop added by multer in req body is file, check if we do have file
  if (req.file) {
    //unlink deletes the file
    fs.unlink(req.file.path, (err) => {
      console.log(err); //if delete fails use call back func, but we dont care abt this error tbh
    }); //path is also a default by multer which holds the file
  }

  //check if a responsse is already been sent by any of the above middlewares.
  if (res.headersSent) {
    return next(error); //we forward the error, dont send a response frm this func cz only 1 res per req
  } //if no res sent to frnt end
  res.status(error.code || 500).json({ message: error.message }); //if error.code is set if not 500 will be set as error code
});

//for render
const PORT = process.env.PORT || 5000

//core idea of database conncetion connect to MongoDb, if ok then start Backend Api if not throw error
mongoose //mongoDB atlas connection URL || before the ? after /, replace the space before ? with a custom name for my created database, by default its "test" when ? only
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nuck6d2.mongodb.net/${process.env.DB_NAME}?appName=Cluster0`,
  )
  .then(() => {
    app.listen(PORT); //if connection successful start the Backend API
  })
  .catch((err) => {
    console.log(err); //throw the error if connection fails
  });
