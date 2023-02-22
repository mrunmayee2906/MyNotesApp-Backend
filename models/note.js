import mongoose from "mongoose";

const Schema = mongoose.Schema;

const noteSchema = new Schema({
  title: String,
  content: String,
  // getting the userID from Users collection
  userID: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "User",
  },
});

noteSchema.set("toJSON", { getters: true });

export default mongoose.model("Note", noteSchema);
