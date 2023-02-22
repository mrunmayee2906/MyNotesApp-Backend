import mongoose from "mongoose";
import { validationResult } from "express-validator";
import HttpError from "../models/http-error.js";
import Note from "../models/note.js";
import User from "../models/user.js";

const getNotes = async (req, res, next) => {
  const userID = req.params.uid;
  // console.log(userID);
  // console.log(req.params);
  const tokenUserID = req.userData.userID;

  if (tokenUserID !== userID) {
    // if the useID extracted from the token does not match the userID in te api url, we'll return an error
    const error = new HttpError(
      "You are not authorised to access this data",
      401
    );
    return next(error);
  }
  let notes;

  try {
    notes = await Note.find({ userID: userID }).sort({ _id: -1 }); // to get the latest notes first
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Fetching notes failed, please try again later",
      500
    );
    return next(error);
  }

  res.json({ notes: notes });
};

const getNoteById = async (req, res, next) => {
  const noteId = req.params.nid;

  let note;

  try {
    note = await Note.findById(noteId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find the note",
      500
    );
    return next(error);
  }

  if (note) {
    res.json({ note });
  } else {
    const error = new HttpError("Could not find note by this id", 404);
    return next(error); //as it it is synchronous, so no issue using throw
  }
};

const createNote = async (req, res, next) => {
  // const userID = "u1";

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // we have errors
    // console.log(errors);
    res.status(422);
    const error = new HttpError("please enter valid data", 422);
    return next(error);
    // return next();
  }

  // api url userID should match body userID and token userID
  const urlUserID = req.params.uid;
  const tokenUserID = req.userData.userID;

  const { title, content, userID } = req.body;

  if (
    urlUserID !== userID ||
    urlUserID !== tokenUserID ||
    userID !== tokenUserID
  ) {
    const error = new HttpError(
      "You are not authorised to access this data",
      401
    );
    return next(error);
  }

  const createdNote = new Note({
    title,
    content,
    userID,
  });
  // console.log(userID);
  let user;

  try {
    user = await User.findById(userID);
  } catch (err) {
    // console.log(err);
    const error = new HttpError("Adding note failed, please try again.", 500);
    // stop the execution if there is an error
    return next(error);
  }

  if (!user) {
    const error = new HttpError("User does not exist", 500);
    // stop the execution if there is an error
    return next(error);
  }

  // save the note to the database
  // also we need to add the note id to user document
  // we need to do all this stuff simulataneously and make sure if any one of them fails, others are undone and database is restored to previous state
  try {
    // using mongodb transactions
    // start the session
    const session = await mongoose.startSession();
    // start a transaction
    session.startTransaction();

    await createdNote.save({ session: session });
    // add noteid to user
    user.notes.push(createdNote); // push is mongoose method
    // save the updated user
    await user.save({ session: session });

    // commit the transaction for this session
    await session.commitTransaction();
    await session.endSession();
  } catch (err) {
    // console.log(err);
    const error = new HttpError("Adding note failed, please try again.", 500);
    // stop the execution if there is an error
    return next(error);
  }

  // send a response
  // if we creae something new, the convention is to return 201 code
  res.status(201).json({ note: createdNote });
};

const deleteNote = async (req, res, next) => {
  const noteId = req.params.nid;
  const userID = req.params.uid;

  const tokenUserID = req.userData.userID;

  if (tokenUserID !== userID) {
    // if the useID extracted from the token does not match the userID in te api url, we'll return an error
    const error = new HttpError(
      "You are not authorised to access this data",
      401
    );
    return next(error);
  }

  let note;
  // find the note by id and delete from database
  // also delete the id from user document
  try {
    // using the populate method to get access to the document related to the ref variable
    note = await Note.findById(noteId).populate("userID");
  } catch (err) {
    // console.log(err);
    const error = new HttpError("Something went wrong, please try again.", 500);
    // stop the execution if there is an error
    return next(error);
  }

  if (!note) {
    return next(new HttpError("Could not find a note for that id", 404));
  }

  try {
    // using mongodb transactions
    // start the session
    const session = await mongoose.startSession();
    // start a transaction
    session.startTransaction();

    await Note.deleteOne({ _id: noteId }).session(session);
    note.userID.notes.pull(note);
    // save the updated user
    await note.userID.save({ session: session });

    // commit the transaction for this session
    await session.commitTransaction();
    await session.endSession();
  } catch (err) {
    // console.log(err);
    const error = new HttpError("Something went wrong, please try again.", 500);
    // stop the execution if there is an error
    return next(error);
  }

  res.status(204).json({ message: "Deleted note successfully" });
};

const editNote = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // we have errors
    // console.log(errors);
    res.status(422);
    const error = new HttpError("please enter valid data", 422);
    return next(error);
  }

  const noteId = req.params.nid;

  const { title, content } = req.body;

  let note;

  // find the note
  try {
    note = await Note.findById(noteId);
  } catch (err) {
    // console.log(err);
    const error = new HttpError("Adding note failed, please try again.", 500);
    // stop the execution if there is an error
    return next(error);
  }

  note.title = title;
  note.content = content;

  // save the note to the database
  try {
    await note.save();
  } catch (err) {
    const error = new HttpError("Adding note failed, please try again.", 500);
    // stop the execution if there is an error
    return next(error);
  }

  // send a response
  // if we creae something new, the convention is to return 201 code
  res.status(201).json({ note: note });
};

export { getNotes, getNoteById, createNote, deleteNote, editNote };
