console.log("LinkedIn GPT Extension: v4 Loaded (Safe Mode)");

// --- HELPER 1: Read Post Text ---
function getPostText(commentBox) {
    // Strategy 1: Look for the nearest specific post container
    let container = commentBox.closest('.feed-shared-update-v2, .artdeco-modal, .occludable-update');

    // Strategy 2: If not found, look for any parent with a 'data-urn' (LinkedIn's internal ID)
    if (!container) {
        container = commentBox.closest('[data-urn]');
    }

    if (container) {
        // Try standard text selectors inside the container
        const textElement = container.querySelector('.update-components-text, .feed-shared-update-v2__description-wrapper, .feed-shared-text-view, .break-words');
        if (textElement) return textElement.innerText;

        // Fallback: Grab the first few lines of the container text
        return container.innerText.split('\n').slice(0, 5).join('\n');
    }

    return null;
}

// --- HELPER 2: Insert Text into LinkedIn Editor ---
function insertReply(commentBox, text) {
    commentBox.focus();

    // Method 1: Standard "User Typing" Simulation (Best for React/Quill editors)
    const success = document.execCommand('insertText', false, text);

    // Method 2: Clipboard Fallback (If Method 1 fails)
    if (!success) {
        navigator.clipboard.writeText(text).then(() => {
            alert("✨ Suggestion copied to clipboard! (Paste it manually)");
        });
    }
}

// --- MAIN: Inject Button ---
function injectButton(commentBox) {
    // Prevent double injection
    const parent = commentBox.closest('.comments-comment-box__form-container') || commentBox.parentElement;
    if (parent.querySelector('.gpt-suggest-btn')) return;

    const btn = document.createElement('button');
    btn.innerText = "✨ AI Reply";
    btn.className = "gpt-suggest-btn";
    btn.style.cssText = `
        background-color: #0a66c2; color: white; border-radius: 16px; border: none; 
        padding: 5px 12px; font-weight: 600; font-size: 14px; cursor: pointer; 
        margin-top: 8px; display: block; z-index: 1000;
    `;

    btn.addEventListener('click', () => {
        let postText = getPostText(commentBox);

        // --- FALLBACK: If auto-detection fails, ask the user ---
        if (!postText) {
            postText = prompt("I couldn't auto-read the post (LinkedIn changed their layout). \n\nPlease copy & paste the post text here:");
            if (!postText) return; // User cancelled
        }

        btn.innerText = "Thinking...";

        chrome.runtime.sendMessage({ action: "fetchSuggestions", postContent: postText }, (response) => {
            btn.innerText = "✨ AI Reply";

            // DEBUG: Log the full response
            console.log("Full response received:", response);

            // CHECK 1: Did the message fail to send?
            if (chrome.runtime.lastError) {
                console.error("Chrome runtime error:", chrome.runtime.lastError);
                alert("Connection error. Please refresh the page.");
                return;
            }

            // CHECK 2: Did the server return success?
            if (response && response.success) {
                console.log("Response data:", response.data);
                console.log("Suggestions array:", response.data?.suggestions);

                // CHECK 3: Do we actually have suggestions?
                if (response.data && response.data.suggestions && response.data.suggestions.length > 0) {
                    const suggestions = response.data.suggestions;
                    console.log("Valid suggestions found:", suggestions.length, suggestions);

                    // Create a modal to show all 3 suggestions
                    showSuggestionModal(suggestions, commentBox);
                } else {
                    console.error("Empty suggestions received. Full response:", JSON.stringify(response, null, 2));
                    alert("The AI replied, but the suggestion list was empty. Check console for details.");
                }
            } else {
                // Handle Server Errors
                console.error("Server error response:", response);
                const errorMsg = response ? response.error : "Unknown Error";
                alert("Error: " + errorMsg);
            }
        });
    });

    parent.appendChild(btn);
}

// --- HELPER 3: Show Suggestion Modal ---
function showSuggestionModal(suggestions, commentBox) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.5); z-index: 10000; display: flex; 
        align-items: center; justify-content: center;
    `;

    // Create modal content
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white; border-radius: 8px; padding: 24px; 
        max-width: 600px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;

    const title = document.createElement('h3');
    title.innerText = '✨ AI Comment Suggestions';
    title.style.cssText = 'margin: 0 0 16px 0; color: #0a66c2; font-size: 18px;';
    modal.appendChild(title);

    // Add each suggestion as a clickable option
    suggestions.forEach((suggestion, index) => {
        const option = document.createElement('div');
        option.style.cssText = `
            padding: 12px; margin-bottom: 12px; border: 2px solid #e0e0e0; 
            border-radius: 8px; cursor: pointer; transition: all 0.2s;
        `;
        option.innerText = `${index + 1}. ${suggestion}`;

        option.addEventListener('mouseenter', () => {
            option.style.borderColor = '#0a66c2';
            option.style.backgroundColor = '#f3f6f8';
        });

        option.addEventListener('mouseleave', () => {
            option.style.borderColor = '#e0e0e0';
            option.style.backgroundColor = 'white';
        });

        option.addEventListener('click', () => {
            insertReply(commentBox, suggestion);
            document.body.removeChild(overlay);
        });

        modal.appendChild(option);
    });

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.innerText = 'Cancel';
    closeBtn.style.cssText = `
        margin-top: 12px; padding: 8px 16px; background: #666; color: white; 
        border: none; border-radius: 4px; cursor: pointer; width: 100%;
    `;
    closeBtn.addEventListener('click', () => document.body.removeChild(overlay));
    modal.appendChild(closeBtn);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) document.body.removeChild(overlay);
    });
}

// --- OBSERVER: Watch for new comment boxes ---
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
                if (node.matches && node.matches('div[role="textbox"]')) injectButton(node);
                else if (node.querySelectorAll) node.querySelectorAll('div[role="textbox"]').forEach(injectButton);
            }
        });
    });
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial Check
document.querySelectorAll('div[role="textbox"]').forEach(injectButton);