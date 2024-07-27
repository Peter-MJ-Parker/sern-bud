import { Schema, model } from "mongoose";

export default model(
  "Birthdays",
  new Schema({
    _id: {
      type: String
    },
    date: {
      type: String
    },
    username: {
      type: String
    },
    nickname: {
      type: String
    }
  }),
  "Birthdays"
)