import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { Clock, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';

const ResultsWaitingScreen = () => {
  const { quizId } = useParams();
  const socket = useSocket();
  const [timeTaken, setTimeTaken] = useState(0);
  const [quizDuration, setQuizDuration] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [waitingMessage, setWaitingMessage] = useState('Results are on the way...');

  useEffect(() => {
    if (!socket) return;

    // Listen for results
    socket.on('quiz-ended', (data) => {
      setCompleted(true);
      setResults(data.results);
      toast.success('Quiz completed! Here are the results.');
    });

    // Show waiting message if completed early
    socket.on('waiting-for-quiz-end', (data) => {
      setTimeTaken(data.timeTaken);
      setQuizDuration(data.quizDuration);
      setWaitingMessage('Results are on the way. Quiz will complete when all time runs out.');
    });

    return () => {
      socket.off('quiz-ended');
      socket.off('waiting-for-quiz-end');
    };
  }, [socket]);

  // Timer for remaining time
  const remainingTime = Math.max(0, quizDuration - timeTaken);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (completed && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Results Header */}
          <div className="text-center mb-10">
            <Trophy size={64} className="text-yellow-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Quiz Completed!</h1>
            <p className="text-gray-600">Here are your final results</p>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Rank</th>
                  <th className="px-6 py-4 text-left font-semibold">Name</th>
                  <th className="px-6 py-4 text-right font-semibold">Score</th>
                  <th className="px-6 py-4 text-right font-semibold">Questions Answered</th>
                  <th className="px-6 py-4 text-center font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {results.map((result, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-gray-50 transition ${
                      idx === 0 ? 'bg-yellow-50' : idx === 1 ? 'bg-gray-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {idx === 0 && <span className="text-2xl">🥇</span>}
                        {idx === 1 && <span className="text-2xl">🥈</span>}
                        {idx === 2 && <span className="text-2xl">🥉</span>}
                        {idx >= 3 && (
                          <span className="text-gray-700 font-semibold">#{result.rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{result.userName}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xl font-bold text-indigo-600">{result.score}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700">
                      {result.answersCount || 0}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {result.isEarlyCompleted ? (
                        <span className="text-xs px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                          Completed Early
                        </span>
                      ) : (
                        <span className="text-xs px-3 py-1 bg-green-100 text-green-800 rounded-full">
                          On Time
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 text-center space-y-4">
            <button
              onClick={() => window.location.href = '/'}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Animated Loading */}
        <div className="mb-6">
          <div className="inline-block">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 border-r-indigo-600 animate-spin"></div>
              <Clock className="absolute inset-0 m-auto text-indigo-600" size={48} />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">Results are on the way</h1>
        <p className="text-gray-600 mb-6 text-lg">{waitingMessage}</p>

        {remainingTime > 0 && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 mb-6">
            <p className="text-gray-600 text-sm mb-2">Time remaining for other participants</p>
            <p className="text-4xl font-bold text-indigo-600">{formatTime(remainingTime)}</p>
          </div>
        )}

        {timeTaken > 0 && (
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <p className="text-green-700 font-semibold">✓ You completed in {timeTaken} seconds</p>
            <p className="text-green-600 text-sm mt-1">Waiting for the quiz to fully complete...</p>
          </div>
        )}

        {/* Progress indicator */}
        <div className="mt-8">
          <div className="text-sm text-gray-500 mb-3">Please wait...</div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsWaitingScreen;
