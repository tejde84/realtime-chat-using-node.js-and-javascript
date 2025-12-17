const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username?.trim() || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const exists = await User.findOne({ username });
    if (exists) return res.status(409).json({ error: "Username already taken" });

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashed });

    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.json({ token });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;