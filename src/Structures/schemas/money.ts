import { Schema, model } from "mongoose";

export default model(
  "Money",
  new Schema({
    username: { type: String },
    nickname: String,
    userID: { type: String, require: true },
    guildName: { type: String, require: true },
    serverID: { type: String, require: true },
    wallet: { type: Number, default: 0 },
    bank: { type: Number, default: 0 }
  }),
  "Money"
)