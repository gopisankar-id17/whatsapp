// server/src/socket/handlers/callHandler.js
// No changes needed to index.js onlineUsers — we use io.to(userId) 
// because index.js already does socket.join(socket.user.id)

const callHandler = (socket, io) => {
  const callerInfo = {
    id:         socket.user.id,
    name:       socket.profile?.name       || "Unknown",
    avatar_url: socket.profile?.avatar_url || null,
  };

  socket.on("call:offer", ({ to, offer }) => {
    io.to(to).emit("call:incoming", {
      from: socket.user.id,
      offer,
      callerInfo,
    });
  });

  socket.on("call:answer", ({ to, answer }) => {
    io.to(to).emit("call:answered", { answer });
  });

  socket.on("call:ice-candidate", ({ to, candidate }) => {
    io.to(to).emit("call:ice-candidate", { candidate });
  });

  socket.on("call:reject", ({ to }) => {
    io.to(to).emit("call:rejected");
  });

  socket.on("call:end", ({ to }) => {
    io.to(to).emit("call:ended");
  });
};

module.exports = callHandler;