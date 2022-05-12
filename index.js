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
const registerUserHandlers = require("./handlers/userHandler");

const onConnection = (socket) => {
  reigsterMsgHandlers(io, socket);
  registerRoomHandlers(io, socket);
  registerUserHandlers(io, socket);
};

io.on("connection", (socket) => {
  console.log(`user connected: ${socket.id}`);
  onConnection(socket);
});

const registerGameLobbyHandlers = require("./handlers/games/gameLobbyHandler");
const registerGameActionHandlers = require("./handlers/games/gameActionHandler");
const onGameConnection = (socket) => {
  registerGameLobbyHandlers(io, socket);
  registerGameActionHandlers(io, socket);
};

const gameNamespace = io.of("/game");
gameNamespace.on("connection", (socket) => {
  console.log(`game connected: ${socket.id}`);
  onGameConnection(socket);
});

server.listen(3001, () => {
  console.log("Server is running on port 3001");
});
