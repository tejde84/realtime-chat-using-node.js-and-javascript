// Basic state
let token = null;
let me = null;
let socket = null;
let currentRoom = "general";
const rooms = new Set(["general", "tech", "random"]);

const $ = (id) => document.getElementById(id);
const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => document.querySelectorAll(sel);

// Auth elements
const loginUsername = $("login-username");
const loginPassword = $("login-password");
const loginBtn = $("login-btn");
const regUsername = $("reg-username");
const regPassword = $("reg-password");
const registerBtn = $("register-btn");
const authStatus = $("auth-status");

const chatSection = $("chat");
const authSection = $("auth");
const meName = $("me-name");
const logoutBtn = $("logout-btn");

// Rooms/presence
const roomList = $("room-list");
const newRoomInput = $("new-room");
const createRoomBtn = $("create-room-btn");
const onlineList = $("online-list");

// Chat panel
const roomTitle = $("room-title");
const messages = $("messages");
const system = $("system");
const messageInput = $("message-input");
const sendBtn = $("send-btn");
const typing = $("typing");

// REST helpers
async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return res.json();
}

// Render helpers
function addMessage(msg) {
  const li = document.createElement("li");
  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = `${msg.sender} • ${new Date(msg.timestamp).toLocaleTimeString()}`;
  const text = document.createElement("div");
  text.textContent = msg.text;
  li.appendChild(meta);
  li.appendChild(text);
  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
}

function setSystem(text) {
  system.textContent = text;
  setTimeout(() => {
    if (system.textContent === text) system.textContent = "";
  }, 4000);
}

function renderPresence(list) {
  onlineList.innerHTML = "";
  list.forEach((u) => {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = u;
    const dot = document.createElement("span");
    dot.textContent = "●";
    dot.style.color = "#55d187";
    onlineList.appendChild(li);
    li.appendChild(name);
    li.appendChild(dot);
  });
}

function renderRooms() {
  roomList.innerHTML = "";
  rooms.forEach((room) => {
    const btn = document.createElement("button");
    btn.className = "room" + (room === currentRoom ? " active" : "");
    btn.dataset.room = room;
    btn.textContent = `# ${room}`;
    btn.onclick = () => switchRoom(room);
    roomList.appendChild(btn);
  });
}

function switchRoom(room) {
  if (room === currentRoom) return;
  socket.emit("leaveRoom", currentRoom);
  currentRoom = room;
  renderRooms();
  roomTitle.textContent = `# ${currentRoom}`;
  messages.innerHTML = "";
  typing.textContent = "";
  socket.emit("joinRoom", currentRoom);
}

// Auth actions
loginBtn.onclick = async () => {
  const data = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: loginUsername.value.trim(), password: loginPassword.value })
  });
  if (data.token) {
    token = data.token;
    me = loginUsername.value.trim();
    authSection.classList.add("hidden");
    chatSection.classList.remove("hidden");
    meName.textContent = me;
    connectSocket();
  } else {
    authStatus.textContent = data.error || "Login failed";
  }
};

registerBtn.onclick = async () => {
  const data = await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username: regUsername.value.trim(), password: regPassword.value })
  });
  authStatus.textContent = data.success ? "Registered! Now sign in." : (data.error || "Registration failed");
};

logoutBtn.onclick = () => {
  if (socket) socket.disconnect();
  token = null;
  me = null;
  messages.innerHTML = "";
  onlineList.innerHTML = "";
  authSection.classList.remove("hidden");
  chatSection.classList.add("hidden");
  authStatus.textContent = "Logged out.";
};

// Socket connection
function connectSocket() {
  socket = io({
    auth: { token }
  });

  socket.on("connect_error", (err) => {
    setSystem(`Socket error: ${err.message}`);
  });

  socket.on("chatHistory", (history) => {
    messages.innerHTML = "";
    history.forEach(addMessage);
  });

  socket.on("chatMessage", (msg) => {
    addMessage(msg);
  });

  socket.on("presence", (list) => {
    renderPresence(list);
  });

  socket.on("systemMessage", (text) => {
    setSystem(text);
  });

  socket.on("typing", ({ username }) => {
    typing.textContent = `${username} is typing...`;
    setTimeout(() => {
      if (typing.textContent === `${username} is typing...`) typing.textContent = "";
    }, 2000);
  });

  // Join default room
  socket.emit("joinRoom", currentRoom);
}

// Send / typing
sendBtn.onclick = () => {
  const text = messageInput.value.trim();
  if (!text) return;
  socket.emit("chatMessage", { room: currentRoom, text });
  messageInput.value = "";
};

messageInput.addEventListener("input", () => {
  if (socket) socket.emit("typing", currentRoom);
});

// Create new room
createRoomBtn.onclick = () => {
  const r = newRoomInput.value.trim().toLowerCase();
  if (!r) return;
  rooms.add(r);
  renderRooms();
  switchRoom(r);
  newRoomInput.value = "";
};

// Initial render
renderRooms();