const express = require("express");
const User = require("../models/User");
const Post = require("../models/Post");
const { protect } = require("../middleware/auth");

const router = express.Router();

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

// @route   PUT /api/users/me  (update own profile)
router.put("/me/update", protect, async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { ...(name && { name }), ...(bio !== undefined && { bio }), ...(avatar && { avatar }) } },
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
