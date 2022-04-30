module.exports = (io, socket) => {
  const handleMsgRoom = (data) => {
    console.log("send_message_room ", data);
    socket.to(data.roomId).emit("receive_message_room", data);
  };

  const handleMsgPrivate = (data) => {
    console.log("send_message_private ", data); //msg, from,  timestamp, to

    const newData = {
      message: data.message,
      from: data.from,
      timestamp: data.timestamp,
    };
    io.to(data.to).emit("receive_message_private", newData);
  };

  socket.on("send_message_room", handleMsgRoom);
  socket.on("send_message_private", handleMsgPrivate);
};
