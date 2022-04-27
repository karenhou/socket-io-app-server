const generateRandomNum = () => {
  let arr = new Set();
  while (arr.size !== 4) {
    let ranNum = Math.floor(Math.random() * 9);
    arr.add(ranNum);
  }
  return [...arr];
};

module.exports = (io, socket) => {
  const startGame = (data) => {
    const objData = { targetNumber: generateRandomNum() };
    console.log("start_game ", data, objData);
    io.in(data.roomId).emit("targeted_number", objData);
  };

  const resetGame = (data) => {
    let objData = { targetNumber: generateRandomNum() };
    console.log("reset_game ", data, objData);
    io.in(data.roomId).emit("reset_game", data);
    io.in(data.roomId).emit("targeted_number", objData);
  };

  const endGame = (data) => {
    console.log("end_game ", data);
    data.timestamp = new Date().getTime();
    io.in(data.roomId).emit("game_result", data);
  };

  socket.on("start_game", startGame); //start a game
  socket.on("reset_game", resetGame); //reset a game
  socket.on("end_game", endGame); //reset a game
};
