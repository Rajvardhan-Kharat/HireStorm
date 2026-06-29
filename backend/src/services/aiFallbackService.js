const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

/**
 * generateContentWithFallback
 * Sequentially tries multiple AI providers until one succeeds.
 * 
 * Order:
 * 1. Gemini (via SDK)
 * 2. Groq (Llama 3 8B via REST API)
 * 3. OpenRouter (Llama 3.1 8B Instruct via REST API)
 * 4. Hugging Face (Meta-Llama-3-8B-Instruct via Inference API)
 */
const generateContentWithFallback = async (prompt) => {
  const errors = [];

  // --- 1. Attempt Gemini ---
  try {
    if (process.env.GEMINI_API_KEY) {
      console.log("[AI Fallback] Attempting Gemini...");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } else {
      errors.push("GEMINI_API_KEY not configured");
    }
  } catch (err) {
    console.warn(`[AI Fallback] Gemini failed: ${err.message}`);
    errors.push(`Gemini: ${err.message}`);
  }

  // --- 2. Attempt Groq ---
  try {
    if (process.env.GROQ_API_KEY) {
      console.log("[AI Fallback] Attempting Groq...");
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama3-8b-8192",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        },
        {
          headers: {
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          timeout: 10000 
        }
      );
      return response.data.choices[0].message.content;
    } else {
      errors.push("GROQ_API_KEY not configured");
    }
  } catch (err) {
    console.warn(`[AI Fallback] Groq failed: ${err.message}`);
    errors.push(`Groq: ${err.message}`);
  }

  // --- 3. Attempt OpenRouter ---
  try {
    if (process.env.OPENROUTER_API_KEY) {
      console.log("[AI Fallback] Attempting OpenRouter...");
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "meta-llama/llama-3.1-8b-instruct:free",
          messages: [{ role: "user", content: prompt }],
        },
        {
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://hirestorm.com", // Required by OpenRouter
            "X-Title": "HireStorm"
          },
          timeout: 15000
        }
      );
      return response.data.choices[0].message.content;
    } else {
      errors.push("OPENROUTER_API_KEY not configured");
    }
  } catch (err) {
    console.warn(`[AI Fallback] OpenRouter failed: ${err.message}`);
    errors.push(`OpenRouter: ${err.message}`);
  }

  // --- 4. Attempt Hugging Face ---
  try {
    if (process.env.HF_API_KEY) {
      console.log("[AI Fallback] Attempting Hugging Face...");
      const response = await axios.post(
        "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct",
        {
          inputs: prompt,
          parameters: { max_new_tokens: 1500, return_full_text: false }
        },
        {
          headers: {
            "Authorization": `Bearer ${process.env.HF_API_KEY}`,
            "Content-Type": "application/json"
          },
          timeout: 15000
        }
      );
      // Hugging Face returns an array. Depending on endpoint it might be { generated_text }
      let text = "";
      if (Array.isArray(response.data) && response.data.length > 0) {
        text = response.data[0].generated_text || response.data[0];
      } else if (response.data && response.data.generated_text) {
        text = response.data.generated_text;
      } else {
        text = typeof response.data === "string" ? response.data : JSON.stringify(response.data);
      }
      return text;
    } else {
      errors.push("HF_API_KEY not configured");
    }
  } catch (err) {
    console.warn(`[AI Fallback] Hugging Face failed: ${err.message}`);
    errors.push(`Hugging Face: ${err.message}`);
  }

  // If we reach here, all configured providers failed
  throw new Error(`All AI providers failed. Errors: ${errors.join(" | ")}`);
};

module.exports = { generateContentWithFallback };
