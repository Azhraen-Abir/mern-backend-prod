//import axios
const axios = require("axios");
//my own error model
const HttpError = require("../models/http-error");
//global const for this file, geoapify api key PUBLIC nt fr prod
const API_KEY = process.env.GEOAPIFY_API_KEY_V1;//outsourced from injected nodemon env variable values for local test & production

//function that takes an address and reaches to Barikoi Api and converts the address to coordinates
//async function; the return val of this func get wrapped into a promise and use await to wait fr the response from the http server
async function getCoordsForAddress(address) {
  //tranform axios error to httError for my node app
  try {
    //get request to a Url ;Our Barikoi API url
    //general Barikoi URL: https://barikoi.xyz/v2/api/search/autocomplete/place?api_key=bkoi_10496a23ada0ccfaed806420672ca4b68dce98bbfff46b06842df6c094a4ef95&q=barikoi&city=dhaka&sub_area=true&sub_district=true
    //get the response by awaiting since async func
    const response = await axios.get(
      "https://api.geoapify.com/v1/geocode/search",
      {
        params: {
          text: address,
          apiKey: API_KEY, // ✅ API key goes HERE
        },
      },
    );

    //get the data out of the response
    const data = response.data; //axios gives us a data field prop on the response obj

    //check if data is not set, if no places data send by barikoi, if length is zero of the sent array
    if (!data || !data.features || data.features.length === 0) {
      //=0 means no coordinates were found for this address

      //location.js aint a middleware has no next so cant next the error we need to throw it
      throw new HttpError(
        "Could not find location for the specidied address.",
        404,
      );
    } //making past the if check makes sure we have no erros

    const [lng, lat] = data.features[0].geometry.coordinates;
    return {
      //extract our coordinates and return them
      //the Barikoi Api response body doesnt have a nested object for lat and lng, so manual access needed and also the body send in full spelling
      lat: lat, //Barikoi doesnt return nested lat and lng and return them seperately as strings
      lng: lng, //so we convert string return to float usin parseFloat
    };
  } catch (error) {
    throw new HttpError(
      "Could not find location for the specified address.",
      404,
    );
  }
}
//since only one export content
module.exports = getCoordsForAddress;
