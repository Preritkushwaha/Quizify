require('dotenv').config();
const { generateQuiz } = require('./config/openrouter');

(async () => {
    try {
        console.log("Testing openrouter...");
        const result = await generateQuiz("React JS basics", "Easy", 2);
        console.log(JSON.stringify(result, null, 2));
    } catch(err) {
        console.error("Test failed:", err);
    }
})();
