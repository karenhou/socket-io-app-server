const express = require("express");
const app = express();
const httpServer = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const server = httpServer.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

const reigsterMsgHandlers = require("./handlers/msgHandler");
const registerRoomHandlers = require("./handlers/roomHandler");
const registerGameHandlers = require("./handlers/gameHandler");

const onConnection = (socket) => {
  reigsterMsgHandlers(io, socket);
  registerRoomHandlers(io, socket);
  registerGameHandlers(io, socket);
};

io.on("connection", (socket) => {
  console.log(`user connected: ${socket.id}`);
  onConnection(socket);
});

server.listen(3001, () => {
  console.log("Server is running on port 3001");
});
