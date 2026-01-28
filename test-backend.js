// Test script for the LinkedIn GPT backend
// Run this with: node test-backend.js

const testBackend = async () => {
    const API_URL = "https://linkedin-gpt-backend-production.up.railway.app/generate-comments";

    const testPost = "Just launched my new product! Excited to share this with the community. It's been an amazing journey building this from scratch.";

    console.log("Testing backend...");
    console.log("URL:", API_URL);
    console.log("Post content:", testPost);
    console.log("\n---\n");

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postContent: testPost })
        });

        console.log("Status:", response.status);
        console.log("Status Text:", response.statusText);

        const data = await response.json();
        console.log("\nResponse data:");
        console.log(JSON.stringify(data, null, 2));

        if (data.suggestions) {
            console.log("\n✅ SUCCESS! Received", data.suggestions.length, "suggestions:");
            data.suggestions.forEach((s, i) => {
                console.log(`\n${i + 1}. ${s}`);
            });
        } else {
            console.log("\n❌ ERROR: No suggestions in response");
        }

    } catch (error) {
        console.error("\n❌ ERROR:", error.message);
    }
};

testBackend();
