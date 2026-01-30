//based on the build in Error object class
class HttpError extends Error {
//execute always whenever this class is fired
    constructor(msg, errorCode){ //js built in error class only takes message even if i store it in msg, its still stored in message in built in error class
     super(msg);
     this.code =errorCode;
    }

}

module.exports = HttpError;