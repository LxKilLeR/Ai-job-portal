const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const authMiddleware = require('../middleware/auth');

// Initialize Gemini AI with API key from environment
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// POST /api/chat - Chat with Gemini AI (requires authentication)
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: 'Messages array is required'
      });
    }

    // Get the model from environment or use default
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    // Build the full conversation as a prompt string
    // The new SDK uses generateContent with a contents array
    const systemPrompt = `You are HireAI, an expert career assistant for an AI-powered job portal. 
Help users with job searching, resume building, interview prep, and career planning. 
Be concise, helpful, and encouraging. Keep responses under 200 words unless user asks for detail.`;

    // Build contents array from message history
    const contents = [];
    for (const msg of messages) {
      if (msg.role === 'system') continue; // skip system messages, we handle via systemInstruction
      const role = msg.role === 'assistant' ? 'model' : 'user';
      const text = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      contents.push({ role, parts: [{ text }] });
    }

    if (contents.length === 0) {
      return res.status(400).json({ success: false, message: 'No messages provided' });
    }

    // Call Gemini API using new SDK style
    const response = await genAI.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    });

    const text = response.text;

    // Return response in a format compatible with the frontend
    res.json({
      success: true,
      content: [{ type: 'text', text: text }]
    });

  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get response from Gemini',
      error: error.message
    });
  }
});

module.exports = router;
