class HttpError extends Error {
  constructor(message, errorCode) {
    // to call method of the Error (base) class
    super(message); //Add a message property to the instances created with this class
    this.code = errorCode;
  }
}

export default HttpError;