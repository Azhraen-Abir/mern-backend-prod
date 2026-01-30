//schema file; connected to mongoose, so need mongoose
const mongoose = require('mongoose');
//create the Schema
const Schema = mongoose.Schema;//access Schema method of mongoose

//actual schema, instantiate and create a new Js object
const placeSchema = new Schema({ //object contains the logic fr the blueprint of our Document
title: {type: String, required: true},//type string and must not be empty
description: {type: String, required: true},
image: { type: String, required: true},//always an URL, the URl is a String too!
address: {type: String, required: true},
location: { //location prop should be a nested object
 lat: {type: String, required: true},
 lng: {type: String, required: true},
},              //turn the creatorId to a real id
creator: {type: mongoose.Types.ObjectId,required: true, ref: 'User'} //the ref: prop conncects this schema to the User schema, by the exact model name
});

//create the model with the Schema
module.exports = mongoose.model('Place', placeSchema)//model() returns a constructor function, requires 2 args
            //1st arg: is the name of the model(upper case start, and no prural) => this will become the name of our collections in small case plural form
            //2nd arg: is the Schema we want to refer