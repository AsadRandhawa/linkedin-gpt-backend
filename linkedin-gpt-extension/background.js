chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchSuggestions") {
        // REPLACE WITH YOUR ACTUAL RAILWAY URL
        const API_URL = "linkedin-gpt-backend-production.up.railway.app";

        fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postContent: request.postContent })
        })
        .then(response => response.json())
        .then(data => sendResponse({ success: true, data }))
        .catch(error => sendResponse({ success: false, error: error.message }));

        return true; // Keep the message channel open for async response
    }
});