const { GoogleGenerativeAI } = require('@google/generative-ai');

// Maps explicit instantiation routing Gemini SDK securely securely
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.generateMCQs = async (dailyLogs) => {
  // Utilizing the flash mapping optimal generating logic for test parsing
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Map explicitly pure Javascript string structures resolving intern tracking arrays natively
  const combinedTasks = dailyLogs.map(log => log.task).join(' ');

  // Structured Gemini mapping string strictly adhering Prompt 7
  const prompt = `Based fundamentally on the following daily work logs mapping a MERN stack intern: "${combinedTasks}"
  Generate exactly 10 Multiple Choice Questions explicitly testing their precise knowledge spanning what they worked on.
  Return ONLY pure JSON mapping array matching strict explicit format natively below:
  [ { "question": "string", "options": ["A", "B", "C", "D"], "correctAnswer": "A" } ]`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    // Javascript extraction cleaning Markdown code block syntaxes explicitly rendering raw JSON structure
    const cleanJson = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('[Gemini Service] Strict map generating error tracking AI blocks:', error);
    throw error;
  }
};
