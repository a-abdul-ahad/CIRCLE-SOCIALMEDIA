require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");
const Post = require("./models/Post");

const seed = async () => {
  await connectDB();
  await User.deleteMany({});
  await Post.deleteMany({});

  const usersData = [
    { name: "Amina Khan", username: "amina", email: "amina@example.com", password: "password123", bio: "Photographer & traveler 📸" },
    { name: "Bilal Ahmed", username: "bilal", email: "bilal@example.com", password: "password123", bio: "Coffee, code, repeat." },
    { name: "Sara Malik", username: "sara", email: "sara@example.com", password: "password123", bio: "Design nerd. Cat mom." },
  ];

  const users = [];
  for (const u of usersData) {
    const user = await User.create({
      ...u,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`,
    });
    users.push(user);
  }

  // amina follows bilal, bilal follows sara
  users[0].following.push(users[1]._id);
  users[1].followers.push(users[0]._id);
  users[1].following.push(users[2]._id);
  users[2].followers.push(users[1]._id);
  await users[0].save();
  await users[1].save();
  await users[2].save();

  const posts = await Post.create([
    { user: users[0]._id, content: "Sunset over the mountains today 🌄", likes: [users[1]._id] },
    { user: users[1]._id, content: "Finally shipped my side project. Feels good!", likes: [users[0]._id, users[2]._id] },
    { user: users[2]._id, content: "New design system, who's excited?" },
  ]);

  console.log(`✅ Seeded ${users.length} users and ${posts.length} posts`);
  console.log("Sample login: amina@example.com / password123");
  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
