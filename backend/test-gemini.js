require('dotenv').config();
const { generateQuiz } = require('./config/gemini');

async function testGemini() {
  try {
    console.log('Testing Gemini API key...');
    const result = await generateQuiz('JavaScript Basics', 'Easy', 2);
    console.log('Result:', JSON.stringify(result, null, 2));
    
    if (result.warning && result.warning.includes('quota')) {
      console.error('Failed! Quota exceeded.');
      process.exit(1);
    } else if (result.warning) {
      console.error('Failed! It used the fallback generator.');
      process.exit(1);
    } else {
      console.log('Success! Gemini generated the quiz.');
      process.exit(0);
    }
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testGemini();
