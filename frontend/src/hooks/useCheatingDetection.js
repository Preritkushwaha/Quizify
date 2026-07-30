// Custom cheating detection hook
import { useEffect, useCallback } from 'react';
import socketService from '../services/socket';

export const useCheatingDetection = (quizId, participantId, isActive) => {
  const reportCheating = useCallback((type) => {
    if (isActive && quizId && participantId) {
      socketService.reportCheating({
        quizId,
        participantId,
        type,
      });
    }
  }, [quizId, participantId, isActive]);

  useEffect(() => {
    if (!isActive) return;

    // Tab switch detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportCheating('tab-switch');
      }
    };

    // Copy attempt detection
    const handleCopy = (e) => {
      e.preventDefault();
      reportCheating('copy-attempt');
    };

    // Paste attempt detection
    const handlePaste = (e) => {
      e.preventDefault();
      reportCheating('paste-attempt');
    };

    // Context menu (right-click) detection
    const handleContextMenu = (e) => {
      e.preventDefault();
      reportCheating('context-menu');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isActive, reportCheating]);

  return { reportCheating };
};
