import { Router } from "express";
import { check } from "express-validator";
import * as noteControllers from "../controllers/noteControllers.js";
import * as authControllers from "../controllers/authControllers.js";
import checkAuth from "../middleware/check-auth.js";
// import HttpError from "../models/http-error";

// Using the express.Router class to create modular, mountable route handlers.
const router = Router();

// ---------- USER ROUTES ------------ //

router.post(
  "/users/login",
  check("email").normalizeEmail().isEmail(),
  check("password").isLength({ min: 6 }),
  authControllers.login
);

router.post(
  "/users/signup",
  check("email").normalizeEmail().isEmail(),
  check("password").isLength({ min: 6 }),
  authControllers.signup
);

// ---------- NOTE ROUTES ------------ //

// before we are able to access these routes, we want to check if reuests have a token
// use a middleware like use before the following routes as reuests travel from top to bottom in our middleware

// router.use(checkAuth);

// reuests without valid token won't reach the bottom routes, as we're handling the error through the above middleware

router.get("/users/:uid", checkAuth, noteControllers.getNotes);

// add new created note to database
// using the express-validator check to validate if the content of the new note is not empty
// the validationResult function would check for errors if sent by the heck function
// we can check it in our controller function
router.post(
  "/users/:uid/notes",
  checkAuth,
  [
    check("content")
      .if((value, { req }) => {
        return req.body.title === "";
      })
      .notEmpty(),
    check("title")
      .if((value, { req }) => {
        return req.body.content === "";
      })
      .notEmpty(),
  ],
  noteControllers.createNote
);

router.get("/users/:uid/notes/:nid", checkAuth, noteControllers.getNoteById);

// edit note and save to database
router.patch(
  "/users/:uid/notes/:nid",
  checkAuth,
  [
    check("content")
      .if((value, { req }) => {
        return req.body.title === "";
      })
      .notEmpty(),
    check("title")
      .if((value, { req }) => {
        return req.body.content === "";
      })
      .notEmpty(),
  ],
  noteControllers.editNote
);

// delete note from database
router.delete("/users/:uid/notes/:nid", checkAuth, noteControllers.deleteNote);

// export the router module to be used in app.js
export default router;
