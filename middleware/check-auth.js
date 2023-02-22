// to validate incoming reuests for its token
import * as jwt from "jsonwebtoken";
import dotenv from "dotenv";
import HttpError from "../models/http-error.js";

dotenv.config();

export default (req, res, next) => {
  let token;

  try {
    // console.log(req.headers);
    token = req.headers.authorization.split(" ")[1];
    // the key value pair would be: Authorization: "Bearer TOKEN"
    // we'll get an array = ["Bearer", "TOKEN"]
    if (!token) {
      // we don't have a valid reuest
      const error = new HttpError("Authentication failed, token!", 403);
      return next(error);
    }

    // we decode the token here
    const decodedToken = jwt.verify(token, process.env.PRIVATE_KEY);
    req.userData = { userID: decodedToken.userID };
    // we add data to reuest which we can use to verifyif it is the same user and not someone else using a valid token
    next();
  } catch (err) {
    console.log(err);
    // if we don't get anything in the header authorization object, then the split function might crash, which we can then report back as an error
    const error = new HttpError("Authentication failed, split", 403);
    return next(error);
  }
};
