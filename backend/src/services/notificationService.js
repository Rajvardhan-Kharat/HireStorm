const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');

/**
 * Create a notification and push it via Socket.IO
 */
const notify = async ({ recipientId, type, title, message, link, channel = ['IN_APP'] }) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      link,
      channel,
    });

    // Push via Socket.IO to the user's personal room
    try {
      const io = getIO();
      io.of('/ilm').to(`user:${recipientId}`).emit('notification:new', notification);
      io.of('/hackathon').to(`user:${recipientId}`).emit('notification:new', notification);
    } catch (socketErr) {
      // Socket may not be initialized in test env
    }

    return notification;
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

/**
 * Broadcast hackathon stage change to all participants in the hackathon room
 */
const broadcastHackathonStage = (hackathonId, newStage) => {
  try {
    const io = getIO();
    io.of('/hackathon').to(`hackathon:${hackathonId}`).emit('hackathon:stage-changed', {
      hackathonId,
      newStage,
    });
  } catch (err) {
    console.error('Broadcast error:', err.message);
  }
};

const broadcastShortlist = (hackathonId, teamIds) => {
  try {
    const io = getIO();
    io.of('/hackathon').to(`hackathon:${hackathonId}`).emit('hackathon:shortlist-released', {
      hackathonId,
      teamIds,
    });
  } catch (err) {}
};

module.exports = { notify, broadcastHackathonStage, broadcastShortlist };
