// WebSocket quiz logic
const Participant = require('../models/Participant');
const Result = require('../models/Result');
const Quiz = require('../models/Quiz');

module.exports = (io) => {
  // Store active quiz sessions
  const activeSessions = new Map();
  // Store early completions
  const earlyCompletions = new Map();

  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

    // Join quiz room
    socket.on('join-quiz', async (data) => {
      try {
        const { quizId, userName, userId } = data;

        socket.join(quizId);

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
          return socket.emit('error', { message: 'Quiz not found' });
        }

        // Find or create participant in quiz
        let participantData = quiz.participants.find(
          p => p.userId?.toString() === userId || p.userName === userName
        );

        if (!participantData) {
          participantData = {
            userId,
            userName,
            socketId: socket.id,
            score: 0,
            answers: [],
            joinedAt: new Date()
          };
          quiz.participants.push(participantData);
          await quiz.save();
        }

        // Initialize session if not exists
        if (!activeSessions.has(quizId)) {
          activeSessions.set(quizId, {
            participants: new Map(),
            startTime: null,
            quizDuration: 0
          });
        }

        const session = activeSessions.get(quizId);
        session.participants.set(socket.id, {
          userId,
          userName,
          socketId: socket.id,
          score: 0,
          answers: [],
          joinedAt: Date.now(),
          completedAt: null,
          isEarlyCompleted: false
        });

        // Broadcast updated participants list (only names and count, no scores)
        const participantList = Array.from(session.participants.values()).map(p => ({
          userName: p.userName,
          isOnline: true
        }));

        io.to(quizId).emit('participants-update', {
          participants: participantList,
          count: session.participants.size,
          quizStatus: quiz.status,
          quizId: quizId
        });

        socket.emit('join-success', {
          participantId: socket.id,
          quizId: quizId,
          quizStatus: quiz.status,
          totalDuration: quiz.totalDuration
        });

        console.log(`User ${userName} joined quiz ${quizId}`);
      } catch (error) {
        console.error('Join Quiz Error:', error);
        socket.emit('error', { message: 'Failed to join quiz: ' + error.message });
      }
    });

    // Admin joins quiz room to monitor participants
    socket.on('admin-join-quiz', async (data) => {
      try {
        const { quizId, adminUserId } = data;
        console.log(`[ADMIN] Admin ${adminUserId} joining quiz room: ${quizId}`);
        
        socket.join(quizId);
        
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
          return socket.emit('error', { message: 'Quiz not found' });
        }

        // Get current session participants
        const session = activeSessions.get(quizId);
        if (session) {
          const participantList = Array.from(session.participants.values()).map(p => ({
            userName: p.userName,
            isOnline: true
          }));
          
          console.log(`[ADMIN] Sending ${participantList.length} participants to admin`);
          socket.emit('participants-update', {
            participants: participantList,
            count: session.participants.size,
            quizStatus: quiz.status,
            quizId: quizId
          });
        } else {
          console.log(`[ADMIN] No active session found, sending empty participants list`);
          socket.emit('participants-update', {
            participants: [],
            count: 0,
            quizStatus: quiz.status,
            quizId: quizId
          });
        }

        socket.emit('admin-joined', { message: 'Admin connected to quiz room' });
      } catch (error) {
        console.error('Admin Join Quiz Error:', error);
        socket.emit('error', { message: 'Failed to join quiz: ' + error.message });
      }
    });

    // Submit answer (participant action)
    socket.on('submit-answer', async (data) => {
      try {
        const { 
          quizId, 
          questionIndex, 
          selectedAnswer, 
          questionId,
          isCorrect,
          timeSpent
        } = data;

        const session = activeSessions.get(quizId);
        if (!session) return;

        const participant = session.participants.get(socket.id);
        if (!participant) return;

        // Calculate points
        const basePoints = isCorrect ? 10 : 0;
        const speedBonus = isCorrect && timeSpent ? 
          Math.max(0, Math.floor((10 - timeSpent) * 10)) : 0;
        const points = basePoints + speedBonus;

        participant.score += points;
        participant.answers.push({
          questionIndex,
          selectedAnswer,
          isCorrect,
          timeSpent,
          answeredAt: new Date(),
          points
        });

        // Update in database
        const quiz = await Quiz.findById(quizId);
        const quizParticipant = quiz.participants.find(p => p.socketId === socket.id);
        if (quizParticipant) {
          quizParticipant.score += points;
          quizParticipant.answers.push({
            questionIndex,
            selectedAnswer,
            isCorrect,
            timeSpent,
            answeredAt: new Date()
          });
          await quiz.save();
        }

        // Send score update to admin only (via private event)
        socket.emit('score-updated', { score: participant.score });

      } catch (error) {
        console.error('Submit Answer Error:', error);
        socket.emit('error', { message: 'Failed to submit answer' });
      }
    });

    // User completed quiz early
    socket.on('quiz-completed-early', async (data) => {
      try {
        const { quizId, timeTaken } = data;

        const session = activeSessions.get(quizId);
        if (!session) return;

        const participant = session.participants.get(socket.id);
        if (!participant) return;

        participant.isEarlyCompleted = true;
        participant.completedAt = Date.now();

        // Store early completion
        if (!earlyCompletions.has(quizId)) {
          earlyCompletions.set(quizId, []);
        }
        earlyCompletions.get(quizId).push({
          userName: participant.userName,
          timeTaken,
          completedAt: Date.now()
        });

        // Send waiting message to this participant only
        socket.emit('waiting-for-quiz-end', {
          message: 'Results are on the way. Quiz will complete when all time runs out.',
          timeTaken,
          quizDuration: session.quizDuration
        });

        console.log(`${participant.userName} completed quiz early in ${timeTaken}s`);

      } catch (error) {
        console.error('Quiz Completed Early Error:', error);
      }
    });

    // Admin starts quiz
    socket.on('start-quiz', async (data) => {
      try {
        const { quizId, userId } = data;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
          return socket.emit('error', { message: 'Quiz not found' });
        }

        // Verify user is admin
        if (quiz.createdBy.toString() !== userId) {
          return socket.emit('error', { message: 'Only quiz creator can start quiz' });
        }

        const session = activeSessions.get(quizId);
        if (session) {
          session.startTime = Date.now();
          
          // Calculate total duration from questions
          const totalDuration = quiz.questions.reduce((sum, q) => sum + (q.timer || 10), 0);
          session.quizDuration = totalDuration;

          // Notify all participants
          io.to(quizId).emit('quiz-started', {
            message: 'Quiz has started!',
            totalDuration,
            questionCount: quiz.questions.length,
            questions: quiz.questions.map(q => ({
              text: q.text,
              options: q.options,
              timer: q.timer
            }))
          });

          // Update database
          quiz.status = 'active';
          quiz.startedAt = new Date();
          quiz.totalDuration = totalDuration;
          await quiz.save();

          console.log(`Quiz ${quizId} started by admin ${userId}`);
        }

      } catch (error) {
        console.error('Start Quiz Error:', error);
        socket.emit('error', { message: 'Failed to start quiz' });
      }
    });

    // Admin ends quiz (after total duration)
    socket.on('end-quiz', async (data) => {
      try {
        const { quizId, userId } = data;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
          return socket.emit('error', { message: 'Quiz not found' });
        }

        // Verify user is admin
        if (quiz.createdBy.toString() !== userId) {
          return socket.emit('error', { message: 'Only quiz creator can end quiz' });
        }

        const session = activeSessions.get(quizId);
        if (!session) {
          return socket.emit('error', { message: 'Quiz session not found' });
        }

        // Mark all early completers with their time
        for (const [socketId, participant] of session.participants) {
          if (participant.isEarlyCompleted) {
            participant.waitingForQuizEnd = false;
          }
          if (!participant.completedAt) {
            participant.completedAt = Date.now();
          }
          participant.timeTakenSeconds = Math.round((participant.completedAt - participant.joinedAt) / 1000);
        }

        // Save final results
        for (const [socketId, participant] of session.participants) {
          const quizParticipant = quiz.participants.find(p => p.socketId === socketId);
          if (quizParticipant) {
            quizParticipant.completedAt = new Date();
            quizParticipant.timeTakenSeconds = participant.timeTakenSeconds;
            quizParticipant.isEarlyCompleted = participant.isEarlyCompleted;
          }
        }

        // Get final results sorted by score
        const finalResults = quiz.participants
          .map((p, idx) => ({
            rank: idx + 1,
            userName: p.userName,
            score: p.score,
            timeTakenSeconds: p.timeTakenSeconds,
            answersCount: p.answers?.length || 0,
            isEarlyCompleted: p.isEarlyCompleted
          }))
          .sort((a, b) => b.score - a.score)
          .map((r, idx) => ({ ...r, rank: idx + 1 }));

        quiz.status = 'completed';
        quiz.completedAt = new Date();
        await quiz.save();

        // Send final results to all participants
        io.to(quizId).emit('quiz-ended', {
          message: 'Quiz completed! Here are the results.',
          results: finalResults,
          completedAt: new Date()
        });

        // Clean up
        activeSessions.delete(quizId);
        earlyCompletions.delete(quizId);

        console.log(`Quiz ${quizId} ended by admin ${userId}`);

      } catch (error) {
        console.error('End Quiz Error:', error);
        socket.emit('error', { message: 'Failed to end quiz' });
      }
    });

    // Get admin dashboard data (scores update)
    socket.on('get-admin-dashboard', async (data) => {
      try {
        const { quizId } = data;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
          return socket.emit('error', { message: 'Quiz not found' });
        }

        // Send current scores to admin
        const participantScores = quiz.participants.map(p => ({
          userName: p.userName,
          score: p.score,
          joinedAt: p.joinedAt,
          completedAt: p.completedAt,
          answersCount: p.answers?.length || 0
        }));

        socket.emit('admin-dashboard-update', {
          status: quiz.status,
          totalDuration: quiz.totalDuration,
          startedAt: quiz.startedAt,
          participants: participantScores
        });

      } catch (error) {
        console.error('Get Admin Dashboard Error:', error);
        socket.emit('error', { message: 'Failed to fetch dashboard' });
      }
    });

    // Track intervals to prevent memory leaks
    const socketIntervals = new Map();

    // Periodic update for admin scores
    socket.on('admin-watch-scores', async (data) => {
      try {
        const { quizId } = data;

        // Clear existing interval if any
        if (socketIntervals.has(socket.id)) {
          clearInterval(socketIntervals.get(socket.id));
        }

        // Send updates every 2 seconds
        const updateInterval = setInterval(async () => {
          const quiz = await Quiz.findById(quizId);
          if (!quiz) {
            clearInterval(updateInterval);
            socketIntervals.delete(socket.id);
            return;
          }

          const participantScores = quiz.participants.map(p => ({
            userName: p.userName,
            score: p.score,
            answersCount: p.answers?.length || 0
          })).sort((a, b) => b.score - a.score);

          socket.emit('admin-scores-update', {
            scores: participantScores,
            timestamp: new Date()
          });
        }, 2000);

        socketIntervals.set(socket.id, updateInterval);

      } catch (error) {
        console.error('Admin Watch Scores Error:', error);
      }
    });

    socket.on('stop-watch-scores', () => {
      if (socketIntervals.has(socket.id)) {
        clearInterval(socketIntervals.get(socket.id));
        socketIntervals.delete(socket.id);
      }
    });

    socket.on('disconnect', () => {
      if (socketIntervals.has(socket.id)) {
        clearInterval(socketIntervals.get(socket.id));
        socketIntervals.delete(socket.id);
      }
    });

    // Report cheating
    socket.on('report-cheating', (data) => {
      try {
        const { quizId, type, details } = data;

        io.to(quizId).emit('cheating-alert', {
          participantId: socket.id,
          type,
          details,
          reportedAt: new Date()
        });

      } catch (error) {
        console.error('Report Cheating Error:', error);
      }
    });

    // Disconnect handler
    socket.on('disconnect', async () => {
      console.log('❌ User disconnected:', socket.id);

      // Update participant status in all quiz sessions
      for (const [quizId, session] of activeSessions) {
        if (session.participants.has(socket.id)) {
          session.participants.delete(socket.id);

          // Notify others
          const participantList = Array.from(session.participants.values()).map(p => ({
            userName: p.userName,
            isOnline: true
          }));

          io.to(quizId).emit('participants-update', {
            participants: participantList,
            count: session.participants.size
          });
        }
      }
    });
  });
};