import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { validationResult } from "express-validator";

import HttpError from "../models/http-error.js";
import User from "../models/user.js";

dotenv.config();

const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid input, please check your data", 422));
  }

  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    // console.log(err);
    // const error = new HttpError(
    //   "Signing up failed, please try later again",
    //   500
    // );
    return next(err);
  }

  if (!existingUser) {
    const error = new HttpError("Incorrect email or password", 403);
    return next(error);
  }

  // here we'll check for the hash password

  let isValidPassword = false;

  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    // this error won't be as a result of unmatching passwords, but some server side error
    const error = new HttpError(
      "Could not log you in, please check you credentials and try again.",
      500
    );
    return next(error);
  }

  // now here we check if the password is valid or not
  if (!isValidPassword) {
    const error = new HttpError("Incorrect email or password", 403);
    return next(error);
  }

  // both email and password is correct, so here we generate the token
  let token;

  try {
    token = jwt.sign(
      { userID: existingUser.id, email: existingUser.email },
      process.env.PRIVATE_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    // console.log(err);
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }

  res.json({
    userID: existingUser.id,
    email: existingUser.email,
    token: token,
  });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid input, please check your data", 422));
  }

  // create a new user, add to database
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    // console.log(err);
    // const error = new HttpError(
    //   "Signing up failed, please try later again",
    //   500
    // );
    return next(err);
  }

  if (existingUser) {
    const error = new HttpError(
      "User exists already, please login instead",
      422
    );
    // console.log(error);
    return next(error);
  }

  let hashedPassword;

  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      "Could not create user, please try again!",
      500
    );
    // console.log(error);
    return next(error);
  }

  const newUser = new User({
    email,
    password: hashedPassword,
    notes: [],
  });

  // save the user to the database
  try {
    await newUser.save();
  } catch (err) {
    // console.log(err);
    // const error = new HttpError("Signing up failed, please try again.", 500);
    // stop the execution if there is an error
    return next(err);
  }

  // creating a token if the user successfully signs up
  let token;

  try {
    // using the userId and email to encode in the token
    // keeping it valid for only an hour
    token = jwt.sign(
      { userID: newUser.id, email: newUser.email },
      process.env.PRIVATE_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  res.status(201).json({
    userID: newUser.id,
    email: newUser.email,
    token: token,
  });
};

export { login, signup };
