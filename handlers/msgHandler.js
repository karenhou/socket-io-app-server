module.exports = (io, socket) => {
  const handleMsg = (payload) => {
    console.log("send_message ", payload);
    socket.to(payload.roomId).emit("receive_message", payload);
  };
  socket.on("send_message", handleMsg);
};
