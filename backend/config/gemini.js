const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Create logs directory
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logPath = path.join(logsDir, 'gemini.log');

// Logging function
const log = (message, data = '') => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message} ${data ? JSON.stringify(data, null, 2) : ''}\n`;
  fs.appendFileSync(logPath, logMessage);
  console.log(message, data);
};

// Gemini API Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Improved fallback quiz generator with topic-specific questions
const generateFallbackQuiz = (topic, difficulty, numberOfQuestions) => {
  log('⚠️ FALLBACK: Using template-based quiz generation', { topic, difficulty });
  
  // Generate more varied and realistic questions
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
    },
    {
      q: `When should you apply ${topic} concepts?`,
      opts: [
        `When they solve a specific problem effectively`,
        `Randomly throughout your projects`,
        `Only when required by your manager`,
        `Never, they're not practical`
      ]
    },
    {
      q: `Which is a common mistake in implementing ${topic}?`,
      opts: [
        `Not properly understanding requirements first`,
        `Spending enough time planning`,
        `Testing the solution thoroughly`,
        `Asking for feedback and reviews`
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
  log('=== STARTING GEMINI QUIZ GENERATION ===');
  log('Parameters:', { prompt, difficulty, numberOfQuestions });

  try {
    // Validate API Key
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured in .env');
    }

    log('✅ API Key validated', { length: GEMINI_API_KEY.length });

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    log('📡 Initializing Gemini model: gemini-2.0-flash');

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.6-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 4096,
      }
    });

    // Create optimized system prompt
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
{"questions":[{"question":"?","options":["","","",""],"correct":0},...]}`;

    log('📤 Sending request to Gemini API...');
    
    const result = await model.generateContent(systemPrompt);

    if (!result || !result.response) {
      throw new Error('Empty response from Gemini API');
    }

    const responseText = result.response.text();
    log('✅ Response received from Gemini', { length: responseText.length });

    // Extract JSON from response
    let jsonText = responseText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    // Find JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from response');
    }

    jsonText = jsonMatch[0];
    log('🔍 Extracted JSON', { preview: jsonText.substring(0, 150) });

    const quizData = JSON.parse(jsonText);

    if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
      throw new Error('No valid questions in response');
    }

    log(`📊 Received ${quizData.questions.length} questions from Gemini API`);

    // Normalize questions
    const validQuestions = quizData.questions.map((q, idx) => ({
      question: q.question || `Question ${idx + 1}`,
      options: (Array.isArray(q.options) && q.options.length === 4) ? q.options : ['A', 'B', 'C', 'D'],
      correct: (typeof q.correct === 'number') ? Math.min(3, Math.max(0, q.correct)) : 0,
      timer: 30
    })).slice(0, numberOfQuestions);

    log(`✅ Generated ${validQuestions.length} REAL AI questions from Gemini!`);
    return { questions: validQuestions };
    
  } catch (apiError) {
    const errorMessage = apiError.message || '';
    log('❌ Gemini API Error:', { message: errorMessage });
    console.error('❌ Error details:', apiError);
    
    // Check if it's a quota error
    const isQuotaError = errorMessage.includes('quota') || errorMessage.includes('429');
    
    if (isQuotaError) {
      log('⚠️ QUOTA EXCEEDED: Using fallback quiz generation (upgrade Gemini API plan)');
    } else {
      log('⚠️ API FAILED: Using fallback quiz generation...');
    }
    
    // Use fallback generation
    try {
      const fallbackResult = generateFallbackQuiz(prompt, difficulty, numberOfQuestions);
      return {
        ...fallbackResult,
        warning: isQuotaError 
          ? 'AI quiz generation quota exceeded. Using template-based questions. Please upgrade your Gemini API plan.'
          : 'AI quiz generation temporarily unavailable. Using template-based questions.'
      };
    } catch (fallbackError) {
      log('❌ Fallback generation failed:', fallbackError.message);
      throw new Error(`Quiz generation failed: ${apiError.message}`);
    }
  }
};

module.exports = { generateQuiz };
