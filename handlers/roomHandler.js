const roomInfo = {};
module.exports = (io, socket) => {
  const getCurrentUsers = (data) => {
    console.log(
      "first getCurrentUsers",
      io.sockets.adapter.rooms.get(data.roomId)
    );
    return io.sockets.adapter.rooms.get(data.roomId);
  };

  const getCurrentUserCount = (data) => {
    return io.sockets.adapter.rooms.get(data.roomId).size;
  };

  const currentRoomInfo = (data, roomInfo) => {
    const currentUserCount = getCurrentUserCount(data);
    const currentUsers = getCurrentUsers(data);

    roomInfo[data.roomId].userCount = currentUserCount;
    roomInfo[data.roomId].curretUser = [...currentUsers];
    console.log("first currentRoomInfo", data, roomInfo);

    io.in(data.roomId).emit("current_room_info", {
      roomId: data.roomId,
      roomHost: roomInfo[data.roomId].roomHost,
      roomPassword: data.roomPassword,
      userCount: currentUserCount,
      curretUser: [...currentUsers],
    });
  };

  const joinRoom = (data) => {
    //room exist, failed to enter password
    if (
      Object.keys(roomInfo).length > 0 &&
      roomInfo[data.roomId].roomPassword !== data.roomPassword
    ) {
      io.to(data.socketId).emit("join_result", {
        msg: "Wrong password",
        roomId: data.roomId,
      });
      return;
    }
    //room doesn't exist, create new room
    if (!Object.keys(roomInfo).includes(data.roomId)) {
      roomInfo[data.roomId] = {
        roomPassword: data.roomPassword,
        roomHost: data.socketId,
      };
    }

    socket.join(data.roomId);
    io.to(data.socketId).emit("join_result", {
      msg: "success",
      roomId: data.roomId,
    });
    currentRoomInfo(data, roomInfo);
    io.in(data.roomId).emit("who_join", data);
  };

  const leaveRoom = (data) => {
    console.log("leave_room ", data, getCurrentUserCount(data));
    io.in(data.roomId).emit("who_left", data);
    socket.leave(data.roomId);
    if (getCurrentUserCount(data) === 0) {
      delete roomInfo[data.roomId];
    } else {
      currentRoomInfo(data, roomInfo);
    }
  };

  const closeRoom = (data) => {
    console.log("receive close room ", data);
    io.in(data.roomId).emit("closed_room", {
      msg: "Room has been closed",
      roomId: data.roomId,
    });
    delete roomInfo[data.roomId];
    io.socketsLeave(data.roomId);
  };

  socket.on("join_room", joinRoom); //join a room
  socket.on("leave_room", leaveRoom); //exit a room
  socket.on("close_room", closeRoom); //close a room
};
