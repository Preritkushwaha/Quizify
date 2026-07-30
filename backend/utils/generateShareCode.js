/**
 * Generate a unique 6-character share code for quizzes
 * Format: 6 alphanumeric characters (uppercase letters and digits)
 * Example: QZ1A2B, AB3CD4, etc.
 */
function generateShareCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

module.exports = { generateShareCode };
