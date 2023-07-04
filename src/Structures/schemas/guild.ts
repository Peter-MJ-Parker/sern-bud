import { Schema, model } from "mongoose";

export default model(
  "Guild",
  new Schema({
    gID: { type: String },
    gName: { type: String },
    prefix: { type: String, default: "?" },
    modC: { type: String, default: "744945603313795306" },
    verifiedRole: { type: String, default: "678400106982277130" },
    welcomeC: { type: String, default: "678400867799400468" },
    leaveC: { type: String, default: "744945603313795306" },
    introC: { type: String, default: "744927896187043940" },
    userCount: { type: Number },
    botCount: { type: Number },
    allCount: { type: Number },
    userCountChan: { type: String, default: "825555223321640970" },
    botCountChan: { type: String, default: "825555224147263549" },
    allCountChan: { type: String, default: "825555222281060363" }
  }),
  "Guild"
)