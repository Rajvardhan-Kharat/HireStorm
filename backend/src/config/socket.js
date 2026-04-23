const { Server } = require('socket.io');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // ── Hackathon Namespace ──────────────────────────────────────────────────
  const hackathonNS = io.of('/hackathon');
  hackathonNS.on('connection', (socket) => {
    // Join a hackathon room
    socket.on('join:hackathon', (hackathonId) => {
      socket.join(`hackathon:${hackathonId}`);
    });
    // Join a team room
    socket.on('join:team', (teamId) => {
      socket.join(`team:${teamId}`);
    });
    socket.on('disconnect', () => {});
  });

  // ── ILM Namespace ────────────────────────────────────────────────────────
  const ilmNS = io.of('/ilm');
  ilmNS.on('connection', (socket) => {
    socket.on('join:internship', (internshipId) => {
      socket.join(`intern:${internshipId}`);
    });
    socket.on('join:mentor', (mentorId) => {
      socket.join(`mentor:${mentorId}`);
    });
    socket.on('disconnect', () => {});
  });

  console.log('✅ Socket.IO initialized');
  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

module.exports = { initSocket, getIO };
