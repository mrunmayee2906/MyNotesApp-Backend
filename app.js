import express, { request } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

import routes from "./routes/routes.js";
import HttpError from "./models/http-error.js";

dotenv.config();

// to avoid deprecation warning as mongoose will switch this property to false in Mongoose 7
mongoose.set("strictQuery", false);

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

// middleware to send add headers to response to avoid CORS error on browser
app.use((req, res, next) => {
  // header name, value

  // here allow access to any domain, any domain can send reuest
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Expose-Headers", "Authorization");
  // which headers these reusts may have
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  // which http methods may be used on the frontend or maybe attached to incoming reuests
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next();
});

app.use("/api/", routes);

// for reuests that don't receive response or that we don't want to handle
app.use((req, res, next) => {
  // use the http-error model that we have created to handle errors
  // arguments: (message, errorCode)
  const error = new HttpError("Could not find this route", 404);
  throw error; //as it it is synchronous, so no issue using throw
});

// to handle errors
app.use((error, req, res, next) => {
  // only excuted when reuests have error attached to it
  if (res.headerSent) {
    // if we have somehow already sent a response, forward the error to the next reuest
    return next(error);
  }
  res.status(error.code || 500);
  // if error code property is not defined then the default would be 500 - server error
  res.json({ message: error.message || "An unknown error has occured" });
});

// connecting to mongodb using mongoose and then listening to the server
mongoose
  .connect(process.env.MONGO_URI) // getting the variable MONGO_URI from .env file
  .then(() =>
    app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    })
  )
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
