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

const generateRandomNum = () => {
  let arr = new Set();
  while (arr.size !== 4) {
    let ranNum = Math.floor(Math.random() * 9);
    arr.add(ranNum);
  }
  return [...arr];
};

io.on("connection", (socket) => {
  console.log(`user connected: ${socket.id}`);

  // socket.on("send_message", (data) => {
  //   console.log(data);
  //   socket.broadcast.emit("receive_message", data);
  // });

  //to a certain room, not the broadcaster
  socket.on("send_message", (data) => {
    console.log("send_message ", data);
    socket.to(data.roomId).emit("receive_message", data);
  });

  //join a room
  socket.on("join_room", (data) => {
    console.log("roomid ", data.roomId);
    if (data.roomId === "") {
      data.roomId = 3;
    }
    socket.join(data.roomId);
    io.in(data.roomId).emit("who_join", data);

    const userCount = io.sockets.adapter.rooms.get(data.roomId).size;
    const curretUser = io.sockets.adapter.rooms.get(data.roomId);
    io.in(data.roomId).emit("num_connection", {
      userCount,
      curretUser: [...curretUser],
    });
  });

  //exit a room
  socket.on("leave_room", (data) => {
    console.log("roomid ", data.roomId);
    socket.leave(data.roomId);
  });

  socket.on("start_game", (data) => {
    const objData = { targetNumber: generateRandomNum() };
    console.log("start_game ", data, objData);
    io.in(data.roomId).emit("targeted_number", objData);
  });

  socket.on("reset_game", (data) => {
    let objData = { targetNumber: generateRandomNum() };
    console.log("reset_game ", data, objData);
    io.in(data.roomId).emit("reset_game", data);
    io.in(data.roomId).emit("targeted_number", objData);
  });

  socket.on("end_game", (data) => {
    console.log("end_game ", data);
    data.timestamp = new Date().getTime();
    io.in(data.roomId).emit("game_result", data);
  });
});

server.listen(3001, () => {
  console.log("Server is running on port 3001");
});
