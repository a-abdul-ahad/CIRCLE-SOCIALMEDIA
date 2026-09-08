const express = require("express");
const User = require("../models/User");
const Post = require("../models/Post");
const Notification = require("../models/Notification"); // Added Notification model
const { protect } = require("../middleware/auth");
const upload = require("../config/upload");

const router = express.Router();

// @route   GET /api/users/search (Search users by name or username)
router.get("/search/query", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: "i" } }, 
        { name: { $regex: q, $options: "i" } }
      ]
    }).select("name username avatar").limit(8);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   GET /api/users/me/notifications (Fetch current user's notifications)
router.get("/me/notifications", protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate("sender", "name username avatar")
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   PUT /api/users/me/notifications/read (Mark notifications as read)
router.put("/me/notifications/read", protect, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, read: false }, { read: true });
    res.json({ message: "Notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   GET /api/users/:username  (profile by username)
router.get("/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() })
      .select("-password")
      .populate("followers", "name username avatar")
      .populate("following", "name username avatar");

    if (!user) return res.status(404).json({ message: "User not found" });

    const postCount = await Post.countDocuments({ user: user._id });

    res.json({ ...user.toObject(), postCount });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   PUT /api/users/me/update  (update own profile)
router.put("/me/update", protect, upload.single("avatar"), async (req, res) => {
  try {
    const { name, bio } = req.body;
    const updateFields = {};
    if (name) updateFields.name = name;
    if (bio !== undefined) updateFields.bio = bio;
    if (req.file) updateFields.avatar = req.file.path; 

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("-password");

    res.json(user);
  } catch (err) {
    res.status(400).json({ message: "Invalid update data", error: err.message });
  }
});

// @route   POST /api/users/:id/follow
router.post("/:id/follow", protect, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    if (targetUser.followers.includes(req.user.id)) {
      return res.status(400).json({ message: "Already following this user" });
    }

    targetUser.followers.push(req.user.id);
    currentUser.following.push(targetUser._id);
    await targetUser.save();
    await currentUser.save();

    // Trigger Notification for the target user
    await Notification.create({
      recipient: targetUser._id,
      sender: currentUser._id,
      type: "follow"
    });

    res.json({ message: "Followed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   POST /api/users/:id/unfollow
router.post("/:id/unfollow", protect, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    targetUser.followers = targetUser.followers.filter((id) => id.toString() !== req.user.id);
    currentUser.following = currentUser.following.filter((id) => id.toString() !== targetUser._id.toString());
    await targetUser.save();
    await currentUser.save();

    res.json({ message: "Unfollowed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;