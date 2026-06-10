const logger = require('../utils/logger');
const { redisClient } = require('../services/redis.service');

const activeExams = new Map(); // Keep track of active exam durations on server

const initSocket = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join room for specific exam session
    socket.on('join_exam', ({ userId, testId, duration }) => {
      const room = `exam_${testId}_${userId}`;
      socket.join(room);
      logger.info(`User ${userId} joined proctored room ${room}`);

      // Initialize server-side timer tracking
      if (!activeExams.has(room)) {
        activeExams.set(room, {
          durationRemaining: duration * 60, // in seconds
          intervalId: setInterval(() => {
            const current = activeExams.get(room);
            if (current && current.durationRemaining > 0) {
              current.durationRemaining--;
              // emit tick
              io.to(room).emit('timer_tick', { remaining: current.durationRemaining });
            } else {
              // Timer expired - trigger auto-submit
              io.to(room).emit('timer_expired');
              clearInterval(current?.intervalId);
              activeExams.delete(room);
            }
          }, 1000)
        });
      }
    });

    // Tab Switch / Proctor Violation warning
    socket.on('proctor_violation', ({ userId, testId, violationType, count }) => {
      const room = `exam_${testId}_${userId}`;
      logger.warn(`Proctor violation for user ${userId} in test ${testId}: ${violationType} (Count: ${count})`);
      
      // Echo warning/violation count back to client
      socket.emit('violation_alert', {
        type: violationType,
        count: count,
        message: count >= 3 ? 'Max tab switches exceeded. Exam will auto-submit.' : `Warning: Tab switches detected. Attempt ${count}/3`
      });

      // If violation exceeds threshold, notify exam session to force-submit
      if (count >= 3) {
        io.to(room).emit('force_submit_exam', { reason: 'proctor_violation_limit_exceeded' });
        
        const current = activeExams.get(room);
        if (current) {
          clearInterval(current.intervalId);
          activeExams.delete(room);
        }
      }
    });

    // Leave exam session
    socket.on('leave_exam', ({ userId, testId }) => {
      const room = `exam_${testId}_${userId}`;
      socket.leave(room);
      logger.info(`User ${userId} left exam room ${room}`);
      
      const current = activeExams.get(room);
      if (current) {
        clearInterval(current.intervalId);
        activeExams.delete(room);
      }
    });

    // Join global leaderboard room and send current rankings as initial state
    socket.on('join_leaderboard', async ({ examCategory } = {}) => {
      socket.join('leaderboard_room');
      logger.info(`Socket ${socket.id} joined live leaderboard room (category: ${examCategory || 'none'})`);

      if (examCategory) {
        try {
          const boardKey = `leaderboard:${examCategory}`;
          const rawLeaderboard = await redisClient.zrevrange(boardKey, 0, 9, 'WITHSCORES');
          const formattedList = [];
          for (let i = 0; i < rawLeaderboard.length; i += 2) {
            formattedList.push({
              name: rawLeaderboard[i],
              score: parseFloat(rawLeaderboard[i + 1]),
              rank: (i / 2) + 1
            });
          }
          socket.emit('leaderboard_update', { examCategory, rankings: formattedList });
        } catch (err) {
          logger.error('Error sending initial leaderboard state: %O', err);
        }
      }
    });

    // Handle score submission to update leaderboard in real time
    socket.on('submit_score', async ({ name, score, examCategory }) => {
      try {
        const boardKey = `leaderboard:${examCategory}`;
        // Add score to Redis sorted set (which falls back to memory safely)
        await redisClient.zadd(boardKey, score, name);
        
        // Fetch top 10 rankings
        const rawLeaderboard = await redisClient.zrevrange(boardKey, 0, 9, 'WITHSCORES');
        const formattedList = [];
        for (let i = 0; i < rawLeaderboard.length; i += 2) {
          formattedList.push({
            name: rawLeaderboard[i],
            score: parseFloat(rawLeaderboard[i + 1]),
            rank: (i / 2) + 1
          });
        }

        // Broadcast to all sockets in leaderboard room
        io.to('leaderboard_room').emit('leaderboard_update', {
          examCategory,
          rankings: formattedList
        });
      } catch (err) {
        logger.error('Error handling live leaderboard socket submit: %O', err);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = { initSocket };
