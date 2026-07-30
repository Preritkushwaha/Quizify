const axios = require('axios');
const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logPath = path.join(logsDir, 'openrouter.log');

const log = (message, data = '') => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message} ${data ? JSON.stringify(data, null, 2) : ''}\n`;
  fs.appendFileSync(logPath, logMessage);
  console.log(message, data);
};

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const generateFallbackQuiz = (topic, difficulty, numberOfQuestions) => {
  log('⚠️ FALLBACK: Using template-based quiz generation', { topic, difficulty });
  
  const difficultyMultiplier = {
    'Easy': 1,
    'Medium': 1.5,
    'Hard': 2
  }[difficulty] || 1;

  const questionTemplates = [
    {
      q: `What is a primary advantage of understanding ${topic}?`,
      opts: [
        `Improved problem-solving in ${topic} contexts`,
        `It makes coding easier but not practical`,
        `It's mainly theoretical with little use`,
        `It only applies to old programming languages`
      ]
    },
    {
      q: `In the context of ${topic}, which approach is most effective?`,
      opts: [
        `Learning by understanding core concepts and practicing`,
        `Memorizing all details without understanding`,
        `Only reading about it without hands-on experience`,
        `Copying code without modification`
      ]
    },
    {
      q: `Which of the following is a best practice for ${topic}?`,
      opts: [
        `Always follow established patterns and guidelines`,
        `Ignore conventions and do it your own way`,
        `Copy-paste solutions without testing`,
        `Avoid documentation and experimentation`
      ]
    },
    {
      q: `What is the key benefit of mastering ${topic}?`,
      opts: [
        `Write cleaner, more maintainable code`,
        `Save time but compromise on quality`,
        `Impress others without improving skills`,
        `Avoid learning other necessary concepts`
      ]
    }
  ];

  const questions = [];
  for (let i = 0; i < numberOfQuestions; i++) {
    const template = questionTemplates[i % questionTemplates.length];
    questions.push({
      question: template.q,
      options: template.opts,
      correct: 0,
      timer: 30 + Math.round(10 * difficultyMultiplier)
    });
  }

  return { questions, isFallback: true };
};

const generateQuiz = async (prompt, difficulty, numberOfQuestions = 10) => {
  log('=== STARTING OPENROUTER QUIZ GENERATION ===');
  log('Parameters:', { prompt, difficulty, numberOfQuestions });

  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured in .env');
    }

    const systemPrompt = `You are an expert quiz generator for technical assessments and education.

Create EXACTLY ${numberOfQuestions} unique, high-quality quiz questions about "${prompt}".

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON - NO markdown, NO code blocks, NO explanations, NO extra text
2. Generate EXACTLY ${numberOfQuestions} questions
3. Each question MUST have EXACTLY 4 options
4. Correct answer should be at index 0 (first option)
5. Questions should be realistic, educational, and practical
6. For programming topics: include code snippets, syntax, output predictions
7. For conceptual topics: focus on real-world applications
8. Difficulty level: ${difficulty}

OUTPUT FORMAT (NO OTHER TEXT):
{"questions":[{"question":"?","options":["","","",""],"correct":0,"timer":30},...]}`;

    log('📤 Sending request to OpenRouter API...');
    
    // Using gemini-2.5-flash or 2.0 via OpenRouter
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'user', content: systemPrompt }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
        'X-Title': 'Quizify AI App',
        'Content-Type': 'application/json'
      }
    });

    const responseContent = response.data.choices[0].message.content;
    log('✅ Response received from OpenRouter', { length: responseContent.length });

    let jsonText = responseContent
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from response');
    }

    jsonText = jsonMatch[0];
    const quizData = JSON.parse(jsonText);

    if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
      throw new Error('No valid questions in response');
    }

    const validQuestions = quizData.questions.map((q, idx) => ({
      question: q.question || `Question ${idx + 1}`,
      options: (Array.isArray(q.options) && q.options.length === 4) ? q.options : ['A', 'B', 'C', 'D'],
      correct: (typeof q.correct === 'number') ? Math.min(3, Math.max(0, q.correct)) : 0,
      timer: q.timer || 30
    })).slice(0, numberOfQuestions);

    log(`✅ Generated ${validQuestions.length} AI questions from OpenRouter!`);
    return { questions: validQuestions };
    
  } catch (apiError) {
    const errorMessage = apiError.response?.data?.error?.message || apiError.message;
    log('❌ OpenRouter API Error:', { message: errorMessage });
    
    try {
      const fallbackResult = generateFallbackQuiz(prompt, difficulty, numberOfQuestions);
      return {
        ...fallbackResult,
        warning: 'AI quiz generation unavailable via OpenRouter. Using template-based questions.'
      };
    } catch (fallbackError) {
      throw new Error(`Quiz generation failed: ${errorMessage}`);
    }
  }
};

module.exports = { generateQuiz };
