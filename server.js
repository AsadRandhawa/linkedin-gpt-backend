const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();

// 1. Allow All Origins
app.use(cors({ origin: '*' }));
app.use(express.json());

// 2. Health Check (Root URL)
app.get('/', (req, res) => {
    console.log("Health check pinger received!"); 
    res.send("✅ Backend is successfully connected to the internet!");
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/generate-comments', async (req, res) => {
    try {
        console.log("Received Request for comments...");
        const { postContent } = req.body;
        
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are a LinkedIn assistant. Keep it professional." },
                { role: "user", content: postContent || "Hello" }
            ],
            max_tokens: 100
        });

        res.json({ suggestions: response.choices[0].message.content.split('\n') });
    } catch (error) {
        console.error("OpenAI Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 3. CRITICAL: FORCE HOST AND PORT
// We hardcode 0.0.0.0 to ensure it listens on all interfaces, not just localhost
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0'; 

app.listen(PORT, HOST, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 SERVER STARTED SUCCESSFULLY`);
    console.log(`👂 Listening on: http://${HOST}:${PORT}`);
    console.log(`==================================================\n`);
});