const express = require("express");
const Post = require("../models/Post");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const upload = require("../config/upload"); // Added the upload middleware

const router = express.Router();

// @route   GET /api/posts  (feed - all posts, newest first; ?user=userId to filter by author)
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.user) filter.user = req.query.user;

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .populate("user", "name username avatar")
      .populate("comments.user", "name username avatar");

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   GET /api/posts/:id  (single post detail)
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", "name username avatar")
      .populate("comments.user", "name username avatar");
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   POST /api/posts  (create a post)
// ADDED: upload.single("media") middleware to handle the incoming file
router.post("/", protect, upload.single("media"), async (req, res) => {
  try {
    const { content } = req.body;
    let mediaUrl = null;
    let mediaType = "none";

    // If a file was uploaded, extract its URL and determine if it's an image or video
    if (req.file) {
      mediaUrl = req.file.path;
      mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";
    }

    // Validation: Require EITHER text content OR a media file
    if ((!content || !content.trim()) && !req.file) {
      return res.status(400).json({ message: "Post content or media is required" });
    }

    // Create the post using the new schema fields
    const post = await Post.create({ 
      user: req.user.id, 
      content: content || "", 
      mediaUrl, 
      mediaType 
    });
    
    const populated = await post.populate("user", "name username avatar");

    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: "Invalid post data", error: err.message });
  }
});

// @route   DELETE /api/posts/:id  (author only)
router.delete("/:id", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }
    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   POST /api/posts/:id/like  (toggle like/unlike)
router.post("/:id/like", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const alreadyLiked = post.likes.some((id) => id.toString() === req.user.id);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== req.user.id);
    } else {
      post.likes.push(req.user.id);
    }

    await post.save();
    res.json({ likes: post.likes, liked: !alreadyLiked });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   POST /api/posts/:id/comments  (add a comment)
router.post("/:id/comments", protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const user = await User.findById(req.user.id);

    post.comments.push({
      user: user._id,
      userName: user.name,
      userAvatar: user.avatar,
      text,
    });

    await post.save();
    res.status(201).json(post.comments[post.comments.length - 1]);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   DELETE /api/posts/:id/comments/:commentId  (comment author only)
router.delete("/:id/comments/:commentId", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    comment.deleteOne();
    await post.save();
    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;