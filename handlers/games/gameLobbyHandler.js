const gameRoom = [];

module.exports = (io, socket) => {
  const createGame = (data) => {
    //check exist
    const idxOfRoom = gameRoom.findIndex(
      (game) => game.roomNum === data.roomNum
    );

    console.log("game ", data, gameRoom, idxOfRoom);
    // if doesn't exist, add it
    if (idxOfRoom === -1) {
      data.currentUser = [
        {
          userSocket: socket.id,
          name: data.username,
        },
      ];
      delete data.username;
      gameRoom.push(data);
      return true;
    } else {
      return false;
    }
  };

  const handleCreateGame = (data) => {
    console.log("create_game ", data);
    const res = createGame(data);

    if (res) {
      //join this socket to this room
      socket.join(data.roomNum);

      const idxOfRoom = gameRoom.findIndex(
        (game) => game.roomNum === data.roomNum
      );

      //broadcast result
      io.of("/game").in(data.roomNum).emit("create_game_result", {
        msg: "success",
        roomInfo: gameRoom[idxOfRoom],
      });
    } else {
      io.of("/game").to(socket.id).emit("create_game_result", {
        msg: "failed",
      });
    }
  };

  const quitGame = (data) => {
    //check if game room exist
    const idxOfRoom = gameRoom.findIndex(
      (game) => game.roomNum === data.roomNum
    );

    //doesn't exist
    if (idxOfRoom === -1) {
      console.log("no such room");
      //remove itself from the page
      io.of("/game").to(socket.id).emit("quit_game_result", {
        msg: "success",
      });
      return;
    }

    //see if this socket is the host, if yes, remove whole room, kick everyone out
    const isHost = gameRoom.findIndex((game) => game.host === socket.id);

    console.log("quitGame b4", gameRoom, data, isHost);
    if (isHost !== -1) {
      //remove this room
      gameRoom.splice(isHost, 1);
      //boardcast in room, that room has been closed
      io.of("/game").in(data.roomNum).emit("gameroom_closed", {
        msg: "Game room has been closed due to host leaving",
        roomId: data.roomId,
      });
      //kick everyone out
      io.of("/game").socketsLeave(data.roomNum);
    } else {
      //kick this socket out
      socket.leave(data.roomNum);
      //inform this socket of quitting result
      io.of("/game").to(socket.id).emit("quit_game_result", {
        msg: "success",
      });

      //inform everyone in room that this socket has left
      io.of("/game")
        .in(data.roomNum)
        .emit("roomInfoUpdate", {
          msg: `${socket.id} has left the game`,
          roomInfo: gameRoom[idxOfRoom],
        });
    }
  };

  const handleQuitGame = (data) => {
    console.log("handleQuitGame socket.id", socket.id);
    quitGame(data);
  };

  const handleJoinGame = (data) => {
    console.log("handleJoinGame", data, gameRoom);
    //check if this room exist
    const idxOfRoom = gameRoom.findIndex(
      (game) => game.roomNum === data.roomNum
    );

    if (idxOfRoom === -1) {
      console.log("inccorecrt password");
      return io.of("/game").to(socket.id).emit("join_game_result", {
        msg: "game room doesnt exist",
      });
    }

    if (gameRoom[idxOfRoom].password !== data.password) {
      console.log("inccorecrt password");
      return io.of("/game").to(socket.id).emit("join_game_result", {
        msg: "incorrect password",
      });
    }

    socket.join(data.roomNum);
    //add this person to gameRoom
    gameRoom[idxOfRoom].currentUser.push({
      userSocket: socket.id,
      name: data.username,
    });

    delete data.username;

    //broadcast result
    io.of("/game").in(data.roomNum).emit("join_game_result", {
      msg: "success",
      roomInfo: gameRoom[idxOfRoom],
    });

    io.of("/game")
      .in(data.roomNum)
      .emit("roomInfoUpdate", {
        msg: `${socket.id} has joined the room`,
        roomInfo: gameRoom[idxOfRoom],
      });
  };

  const handleLogoutGame = (data) => {
    console.log("handleLogoutGame socket.id", socket.id);

    //remove this socket from the gameRoom
    const idxOfRoom = gameRoom.findIndex(
      (game) => game.roomNum === data.roomNum
    );

    const idxOfUser = gameRoom[idxOfRoom].currentUser.findIndex(
      (user) => user.userSocket === socket.id
    );

    if (idxOfUser !== -1 && idxOfRoom !== -1) {
      delete gameRoom[idxOfRoom].currentUser[idxOfUser];
      socket.leave(data.roomNum);
      io.of("/game")
        .in(data.roomNum)
        .emit("roomInfoUpdate", {
          msg: `${socket.id} has lefted the room`,
          roomInfo: gameRoom[idxOfRoom],
        });
    }
  };
  socket.on("create_game", handleCreateGame);
  socket.on("quit_game", handleQuitGame);
  socket.on("join_game", handleJoinGame);
  socket.on("logout_game", handleLogoutGame);
};
