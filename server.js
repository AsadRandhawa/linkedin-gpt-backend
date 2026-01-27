const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();

// 1. Allow All Origins
app.use(cors({ origin: '*' }));
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 2. NEW: Add a Root Route (Health Check)
// This lets you click the Railway link and see if it works immediately.
app.get('/', (req, res) => {
    res.send("✅ Backend is running! You can now use the Chrome Extension.");
});

app.post('/generate-comments', async (req, res) => {
    try {
        const { postContent } = req.body;
        if (!postContent) return res.status(400).json({ error: 'No text provided' });

        console.log("Generating comment for length:", postContent.length);

        const response = await openai.chat.completions.create({
            model: "gpt-4o", 
            messages: [
                { role: "system", content: "You are a helpful LinkedIn assistant. Generate 3 short, professional comments." },
                { role: "user", content: postContent }
            ],
            max_tokens: 100
        });

        const suggestions = response.choices[0].message.content.split('\n').filter(l => l.length > 0);
        res.json({ suggestions });

    } catch (error) {
        console.error("OpenAI Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 3. CRITICAL: Bind to 0.0.0.0 and correct PORT
const PORT = process.env.PORT || 8080; // Default to 8080 for Railway compatibility
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});