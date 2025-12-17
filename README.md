
# 💬 ChatHub – Real‑Time Chat Application

A full‑stack real‑time chat app built with **Node.js, Express, Socket.IO, and MongoDB**, featuring authentication, chat rooms, message persistence, typing indicators, and online presence. Designed with a sleek dark UI for recruiter‑friendly demos.

---

## ✨ Features

- 🔐 **User Authentication** – Register/Login with JWT tokens and secure password hashing (bcrypt).
- 🏠 **Chat Rooms** – Join default rooms or create new ones dynamically.
- 💾 **Message Persistence** – All messages stored in MongoDB, with history loaded on room join.
- 👀 **Typing Indicators** – See when someone is typing in real‑time.
- 🟢 **Online Presence** – Live list of connected users per room.
- 🎨 **Dark Theme UI** – Responsive, interactive frontend with hover effects and animations.

---

## 📂 Project Structure

```
realtime-chat-app/
├─ server.js          # Express + Socket.IO backend
├─ .env               # Environment variables
├─ /models            # Mongoose models (User, Message)
├─ /routes            # Auth routes
├─ /middleware        # JWT auth middleware
└─ /public            # Frontend (index.html, style.css, app.js)
```

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/<your-username>/realtime-chat-app.git
cd realtime-chat-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the root:
```
PORT=3000
MONGO_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your_secret_key
ORIGIN=http://localhost:3000
```

### 4. Run locally
```bash
npm run dev
```
Visit: [http://localhost:3000](http://localhost:3000)

---

## 🖥 Demo Flow

1. **Register** a new user.
2. **Login** → JWT issued.
3. **Join a room** (default: `#general`).
4. **Chat in real‑time** across multiple tabs.
5. Watch **typing indicators** and **online presence** update live.



## 📜 License

MIT License © 2025 Tejas
