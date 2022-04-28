module.exports = (io, socket) => {
  const handleMsg = (data) => {
    console.log("send_message ", data);
    socket.to(data.roomId).emit("receive_message", data);
  };
  socket.on("send_message", handleMsg);
};
