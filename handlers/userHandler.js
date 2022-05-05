let userInfo = [];

module.exports = (io, socket) => {
  const handleLogin = (data) => {
    console.log("login ", data); //name, password, socket id
    let mySet = new Set([...userInfo, data]);
    userInfo = [...mySet];
    io.to(data.socketId).emit("login_result", {
      msg: "success",
    });
  };

  const handleGetCurrentUsers = () => {
    console.log("handleGetCurrentUsers ", userInfo);

    if (userInfo.length > 0) {
      userInfo.forEach((user) => {
        io.to(user.socketId).emit("get_current_users_result", {
          users: userInfo,
        });
      });
    }
  };

  const handleLogout = (data) => {
    const userIndex = userInfo.findIndex(
      (user) => user.socketId === data.socketId
    );
    if (userIndex === -1) {
      console.log("user not found");
    } else {
      userInfo.splice(userIndex, 1);
    }

    io.to(data.socketId).emit("logout_result", {
      msg: "success",
    });

    console.log("handleGetCurrentUsers, logout", data, userInfo);
    handleGetCurrentUsers();
  };

  socket.on("login", handleLogin);
  socket.on("logout", handleLogout);
  socket.on("get_current_users", handleGetCurrentUsers);

  const addUser = (data) => {
    console.log("userInfo ", data, userInfo);

    //check exist
    const isUserExist = userInfo.findIndex(
      (user) => user.username === data.username
    );

    // if doesn't exist, add it
    if (isUserExist === -1) {
      userInfo.push(data);
    } else {
      // if exist, updates it
      userInfo.some((user, index) => {
        if (user.username === data.username) {
          userInfo[index] = data;
        }
      });
    }
  };

  const handleAddUser = (data) => {
    console.log("handleAddUser ", data);
    addUser(data);
    io.emit("getUsers", userInfo);
  };

  socket.on("addUser", handleAddUser);
};
