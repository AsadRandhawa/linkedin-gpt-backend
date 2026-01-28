// FORCE UPDATE: V5 - Debugging Empty List
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
                {
                    role: "system",
                    content: "You are a LinkedIn assistant. Generate exactly 3 distinct, professional comment suggestions. Format each suggestion on a new line starting with '1.', '2.', and '3.'. Keep each comment concise (1-2 sentences)."
                },
                { role: "user", content: `Generate 3 professional comment suggestions for this LinkedIn post:\n\n${postContent}` }
            ],
            max_tokens: 200,
            temperature: 0.8
        });

        // DEBUG: See exactly what AI returned in Railway Logs
        const rawText = response.choices[0].message.content;
        console.log("OpenAI Raw Output:", rawText);

        // Improved Parsing Logic
        let suggestions = [];

        // Try to split by numbered format (1. 2. 3.)
        const numberedMatches = rawText.match(/\d+\.\s*(.+?)(?=\d+\.|$)/gs);
        if (numberedMatches && numberedMatches.length >= 3) {
            suggestions = numberedMatches
                .slice(0, 3)
                .map(match => match.replace(/^\d+\.\s*/, '').trim());
        } else {
            // Fallback: Split by double newline or single newline
            suggestions = rawText
                .split(/\n\n|\n/)
                .map(line => line.trim())
                .filter(line => line.length > 10) // Filter out very short lines
                .map(line => line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, ''))
                .slice(0, 3); // Take first 3
        }

        // FINAL FALLBACK: If still empty, create generic suggestions
        if (suggestions.length === 0) {
            suggestions = [
                "Great insights! Thanks for sharing this perspective.",
                "This is really valuable information. Looking forward to seeing more content like this!",
                "Interesting points! I'd love to hear more about your experience with this."
            ];
            console.log("WARNING: Using fallback suggestions");
        }

        // Ensure we always have exactly 3 suggestions
        while (suggestions.length < 3) {
            suggestions.push("Thanks for sharing! This is really insightful.");
        }
        suggestions = suggestions.slice(0, 3);

        console.log("Final Suggestions Count:", suggestions.length);
        console.log("Suggestions:", suggestions);

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