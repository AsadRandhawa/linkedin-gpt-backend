const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();

// 1. Allow All Origins (Fixes connection errors)
app.use(cors({ origin: '*' }));
app.use(express.json());

// 2. Health Check (Root URL)
// Visiting your Railway URL in a browser will show this message.
app.get('/', (req, res) => {
    console.log("Health check pinger received!"); 
    res.send("✅ Backend is successfully connected to the internet!");
});

// 3. Setup OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 4. Main Generation Route
app.post('/generate-comments', async (req, res) => {
    try {
        const { postContent } = req.body;
        console.log("\n--- NEW REQUEST ---");
        console.log("Post Length:", postContent ? postContent.length : 0);

        if (!postContent) {
            return res.status(400).json({ error: "No post content provided" });
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are a LinkedIn assistant. Generate 3 distinct, professional options for a comment. Separate them with a double newline." },
                { role: "user", content: postContent }
            ],
            max_tokens: 150
        });

        // DEBUG: See exactly what AI returned in Railway Logs
        const rawText = response.choices[0].message.content;
        console.log("OpenAI Raw Output:", rawText);

        // Parsing Logic: Split by newline, filter empty lines, remove bullets
        let suggestions = rawText
            .split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => line.replace(/^-\s*/, '').replace(/^\d+\.\s*/, ''));

        // FALLBACK: If splitting killed everything, just send the raw text as one suggestion
        if (suggestions.length === 0) {
            suggestions = [rawText];
        }

        res.json({ suggestions });

    } catch (error) {
        console.error("OpenAI Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 5. CRITICAL: FORCE HOST AND PORT
// We hardcode 0.0.0.0 to ensure it listens on all interfaces, not just localhost
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0'; 

app.listen(PORT, HOST, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 SERVER STARTED SUCCESSFULLY`);
    console.log(`👂 Listening on: http://${HOST}:${PORT}`);
    console.log(`==================================================\n`);
});