// server.js
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config(); // Loads .env file (if running locally)

const app = express();

// --- CRITICAL FIX FOR "net::ERR_FAILED" ---
// We allow requests from ANYWHERE ('*') for now.
// Once you are 100% sure it works, you can lock this down later.
app.use(cors({ origin: '*' })); 

app.use(express.json());

// Initialize OpenAI with the key from Railway variables
const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY 
});

// The Route your extension calls
app.post('/generate-comments', async (req, res) => {
    try {
        const { postContent } = req.body;

        if (!postContent) {
            return res.status(400).json({ error: 'Post content is required' });
        }

        console.log("Received request for post length:", postContent.length);

        const response = await openai.chat.completions.create({
            model: "gpt-4o", // Or "gpt-3.5-turbo" if you want to save money
            messages: [
                { 
                    role: "system", 
                    content: "You are a professional LinkedIn networking assistant. Read the user's LinkedIn post and generate 3 distinct, engaging, and professional comments that I could post as a reply. Keep them under 30 words each. Do not add numbering or quotes." 
                },
                { role: "user", content: postContent }
            ],
            max_tokens: 150,
            temperature: 0.7,
        });

        // Clean up the output (split by newlines and remove empty lines)
        const suggestions = response.choices[0].message.content
            .split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => line.replace(/^-\s*/, '').replace(/^\d+\.\s*/, '')); // Remove bullets/numbers

        res.json({ suggestions });

    } catch (error) {
        console.error("OpenAI Error:", error);
        res.status(500).json({ error: 'Failed to generate comments', details: error.message });
    }
});

// Start the server
// Railway automatically sets process.env.PORT, otherwise we use 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});