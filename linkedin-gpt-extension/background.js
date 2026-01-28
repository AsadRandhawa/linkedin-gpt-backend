chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchSuggestions") {
        console.log("Background: Sending text to Railway...");

        // FIXED: Pointing to the correct endpoint
        const API_URL = "https://linkedin-gpt-backend-production.up.railway.app/generate-comments";

        fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postContent: request.postContent })
        })
            .then(response => response.json())
            .then(data => {
                console.log("Background: Received data:", data);
                sendResponse({ success: true, data });
            })
            .catch(error => {
                console.error("Background: Fetch Error:", error);
                sendResponse({ success: false, error: error.message });
            });

        return true; // <--- THIS IS CRITICAL. DO NOT DELETE.
    }
});