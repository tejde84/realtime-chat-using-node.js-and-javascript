const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    room: { type: String, required: true },
    sender: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);