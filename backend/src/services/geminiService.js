'use strict';

/**
 * geminiService.js
 * ─────────────────
 * Wraps @google/generative-ai to generate 10 MERN-stack MCQs
 * based on a student's recent daily logs.
 *
 * Required env var: GEMINI_API_KEY
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * generateMCQs
 * ─────────────
 * Feeds the last N daily logs to Gemini and gets back 10 MCQs.
 *
 * @param {Array<{date: Date, task: string, blockers: string}>} logs
 * @returns {Promise<Array<{question, options, answer}>>}
 */
const generateMCQs = async (logs) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Build a readable summary of recent work
  const logSummary = logs
    .slice(-20) // last 20 working days
    .map((l, i) => `Day ${i + 1}: ${l.task}${l.blockers ? ` | Blocker: ${l.blockers}` : ''}`)
    .join('\n');

  const prompt = `
You are an expert MERN-stack technical interviewer.
Below are a software engineering intern's recent daily work logs from their 90-day MERN-stack internship:

--- INTERN LOGS START ---
${logSummary}
--- INTERN LOGS END ---

Based STRICTLY on the technologies, concepts, and tasks mentioned in these logs, generate exactly 10 Multiple Choice Questions (MCQs) to test the intern's understanding.

Rules:
1. Every question MUST relate to something mentioned in the logs (MongoDB, Express.js, React, Node.js, or specific features worked on).
2. Each question must have exactly 4 options labeled A, B, C, D.
3. Exactly one option must be correct.
4. Vary difficulty: 3 easy, 4 medium, 3 hard.
5. Return ONLY a valid JSON array — no markdown, no explanation, pure JSON.

Required JSON format:
[
  {
    "question": "...",
    "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
    "answer": "A"
  }
]
`;

  const result = await model.generateContent(prompt);
  const text   = result.response.text().trim();

  // Strip markdown code fences if present
  const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

  let questions;
  try {
    questions = JSON.parse(clean);
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${clean.slice(0, 200)}`);
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('Gemini did not return a valid question array');
  }

  return questions.slice(0, 10); // ensure max 10
};

module.exports = { generateMCQs };
