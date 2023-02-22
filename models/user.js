import mongoose from "mongoose";
import uniqueValidator from "mongoose-unique-validator";

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please fill a valid email address",
    ],
  },
  password: {
    type: String,
    required: true,
    minLength: [6, "Password should be minimum 6 characters"],
  },
  // store the ids of notes
  notes: [
    {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Note",
    },
  ],
});

// using the plugin mongoose-unique-validator to ensure we don't create new user with existing email
userSchema.plugin(uniqueValidator);
userSchema.set("toJSON", { getters: true });

export default mongoose.model("User", userSchema);
