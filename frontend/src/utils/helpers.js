export const calculateScore = (answers, questions) => {
  let score = 0;
  answers.forEach((answer, index) => {
    if (answer.selected === questions[index].correct) {
      score += 1;
    }
  });
  return score;
};

export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const getPercentage = (score, total) => {
  return Math.round((score / total) * 100);
};
