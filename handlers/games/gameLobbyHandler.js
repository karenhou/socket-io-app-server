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
      console.log("game room doesnt exist");
      return io.of("/game").to(socket.id).emit("join_game_result", {
        msg: "game room doesnt exist",
      });
    }

    //check if this room is full
    if (
      gameRoom[idxOfRoom].currentUser.length >=
      gameRoom[idxOfRoom].maxPlayerCount
    ) {
      console.log("room full");
      return io.of("/game").to(socket.id).emit("join_game_result", {
        msg: "room is full",
      });
    }

    //check if password is correct
    if (gameRoom[idxOfRoom].password !== data.password) {
      console.log("incorecrt password");
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
        msg: `${socket.id} has joined the game`,
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

  const handleKickPlayer = async (data) => {
    console.log("handleKickPlayer", data);

    //check if this room exist
    const idxOfRoom = gameRoom.findIndex(
      (game) => game.roomNum === data.roomNum
    );

    if (idxOfRoom === -1) {
      console.log("no such room");
      //remove itself from the page
      io.of("/game").to(socket.id).emit("kick_player_result", {
        msg: "no such room",
      });
      return;
    }

    //check if this socket exist in that room
    const idxOfUser = gameRoom[idxOfRoom].currentUser.findIndex(
      (user) => user.userSocket === data.userSocket
    );

    if (idxOfUser === -1) {
      console.log("no such user");
      io.of("/game").to(socket.id).emit("kick_player_result", {
        msg: "no such user",
      });
      return;
    }

    //remove this user from gameRoom
    gameRoom[idxOfRoom].currentUser.splice(idxOfUser, 1);

    //inform host
    io.of("/game").to(socket.id).emit("kick_player_result", {
      msg: "success",
    });

    //inform victim
    io.of("/game")
      .to(data.userSocket)
      .emit("you_been_kicked", {
        msg: `You've been kicked out of the game #${data.roomNum}`,
      });
    //fetch list of user socket, disconnect this user from the room
    const currentSockets = await io.of("/game").in(data.roomNum).fetchSockets();
    for (const socket of currentSockets) {
      if (socket.id === data.userSocket) {
        socket.leave(data.roomNum);
      }
    }

    //broadcast to room that this user has been kicked
    io.of("/game")
      .in(data.roomNum)
      .emit("roomInfoUpdate", {
        msg: `${data.userSocket} has been kicked out of the game`,
        roomInfo: gameRoom[idxOfRoom],
      });
  };
  socket.on("create_game", handleCreateGame);
  socket.on("quit_game", handleQuitGame);
  socket.on("join_game", handleJoinGame);
  socket.on("logout_game", handleLogoutGame);
  socket.on("kick_player", handleKickPlayer);
};
