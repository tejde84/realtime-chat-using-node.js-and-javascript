require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/auth");
const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());
app.use(cors({ origin: process.env.ORIGIN || "http://localhost:3000" }));
app.use(express.static("public")); // serve frontend

// API routes
app.use("/api/auth", authRoutes);

// Protected example endpoint (optional)
app.get("/api/me", authMiddleware, (req, res) => {
  res.json({ username: req.user.username });
});

// In-memory online users per room
const onlineUsers = new Map(); // room -> Set(usernames)

function addUserToRoom(room, username) {
  if (!onlineUsers.has(room)) onlineUsers.set(room, new Set());
  onlineUsers.get(room).add(username);
}

function removeUserFromRoom(room, username) {
  if (!onlineUsers.has(room)) return;
  const set = onlineUsers.get(room);
  set.delete(username);
  if (set.size === 0) onlineUsers.delete(room);
}

function getUsersInRoom(room) {
  return Array.from(onlineUsers.get(room) || []);
}

// Socket.IO auth via handshake
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("No token"));
  const jwt = require("jsonwebtoken");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // { username }
    next();
  } catch (e) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  const username = socket.user?.username;
  console.log(`Socket connected: ${username}`);

  // Join a room and get history + presence
  socket.on("joinRoom", async (room) => {
    if (!room) return;
    socket.join(room);
    addUserToRoom(room, username);

    // Send chat history
    const history = await Message.find({ room }).sort({ timestamp: 1 }).limit(500);
    socket.emit("chatHistory", history);

    // Broadcast presence update
    io.to(room).emit("presence", getUsersInRoom(room));
    io.to(room).emit("systemMessage", `${username} joined ${room}`);
  });

  // Leave a room
  socket.on("leaveRoom", (room) => {
    if (!room) return;
    socket.leave(room);
    removeUserFromRoom(room, username);
    io.to(room).emit("presence", getUsersInRoom(room));
    io.to(room).emit("systemMessage", `${username} left ${room}`);
  });

  // Handle message
  socket.on("chatMessage", async ({ room, text }) => {
    if (!room || !text?.trim()) return;
    const msg = await Message.create({ room, sender: username, text: text.trim() });
    io.to(room).emit("chatMessage", msg);
  });

  // Typing indicator
  socket.on("typing", (room) => {
    if (!room) return;
    socket.to(room).emit("typing", { username });
  });

  // On disconnect, update presence in all rooms the socket was in
  socket.on("disconnecting", () => {
    const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
    rooms.forEach((room) => {
      removeUserFromRoom(room, username);
      io.to(room).emit("presence", getUsersInRoom(room));
      io.to(room).emit("systemMessage", `${username} disconnected`);
    });
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${username}`);
  });
});

// DB + server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });