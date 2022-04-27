module.exports = (io, socket) => {
  const joinRoom = (data) => {
    console.log("join_room ", data);
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
  };

  const leaveRoom = (data) => {
    console.log("leave_room ", data);
    socket.leave(data.roomId);
  };

  socket.on("join_room", joinRoom); //join a room
  socket.on("leave_room", leaveRoom); //exit a room
};
