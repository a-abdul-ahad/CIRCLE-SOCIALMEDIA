const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String, default: "" },
    text: { type: String, required: true, maxlength: 300 },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    
    content: { type: String, required: false, maxlength: 500 }, 
    
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
    
    mediaUrl: { type: String, default: null },
    mediaType: { type: String, enum: ['image', 'video', 'none'], default: 'none' },
  },
  { timestamps: true }
);



module.exports = mongoose.model("Post", postSchema);
