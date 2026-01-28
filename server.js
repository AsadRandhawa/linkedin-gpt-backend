// LinkedIn GPT Backend - Stable Version
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai').default;
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Health Check
app.get('/', (req, res) => {
    console.log("Health check received");
    res.send("✅ Backend is running!");
});

// Initialize OpenAI
let openai;
try {
    if (!process.env.OPENAI_API_KEY) {
        console.error("❌ OPENAI_API_KEY not set!");
    } else {
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        console.log("✅ OpenAI initialized");
    }
} catch (error) {
    console.error("Error initializing OpenAI:", error.message);
}

// Generate Comments Endpoint
app.post('/generate-comments', async (req, res) => {
    try {
        const { postContent } = req.body;

        if (!postContent) {
            return res.status(400).json({ error: "No post content provided" });
        }

        if (!openai) {
            return res.status(500).json({ error: "OpenAI not configured" });
        }

        console.log("Generating comments for post:", postContent.substring(0, 50) + "...");

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a LinkedIn assistant. Generate exactly 3 distinct, professional comment suggestions. Format each on a new line starting with '1.', '2.', and '3.'. Keep each comment concise (1-2 sentences)."
                },
                { role: "user", content: `Generate 3 professional comment suggestions for this LinkedIn post:\n\n${postContent}` }
            ],
            max_tokens: 200,
            temperature: 0.8
        });

        const rawText = response.choices[0].message.content;
        console.log("OpenAI response:", rawText);

        // Parse suggestions
        let suggestions = [];

        // Try numbered format
        const numberedMatches = rawText.match(/\d+\.\s*(.+?)(?=\d+\.|$)/gs);
        if (numberedMatches && numberedMatches.length >= 3) {
            suggestions = numberedMatches
                .slice(0, 3)
                .map(match => match.replace(/^\d+\.\s*/, '').trim());
        } else {
            // Fallback: split by newlines
            suggestions = rawText
                .split(/\n\n|\n/)
                .map(line => line.trim())
                .filter(line => line.length > 10)
                .map(line => line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, ''))
                .slice(0, 3);
        }

        // Ensure 3 suggestions
        const fallbackSuggestions = [
            "Great insights! Thanks for sharing this perspective.",
            "This is really valuable information. Looking forward to more!",
            "Interesting points! I'd love to hear more about your experience."
        ];

        while (suggestions.length < 3) {
            suggestions.push(fallbackSuggestions[suggestions.length]);
        }
        suggestions = suggestions.slice(0, 3);

        console.log("Final suggestions:", suggestions);
        res.json({ suggestions });

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🚀 SERVER STARTED SUCCESSFULLY`);
    console.log(`👂 Listening on: http://${HOST}:${PORT}`);
    console.log(`${'='.repeat(50)}\n`);
});