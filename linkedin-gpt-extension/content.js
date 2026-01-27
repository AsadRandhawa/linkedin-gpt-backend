console.log("LinkedIn GPT Extension: v3 Loaded");

// --- HELPER: Read Post Text ---
function getPostText(commentBox) {
    // Strategy 1: Look for the nearest specific post container (Feed or Modal)
    let container = commentBox.closest('.feed-shared-update-v2, .artdeco-modal, .occludable-update');
    
    // Strategy 2: If not found, look for any parent with a 'data-urn' (LinkedIn's internal ID)
    if (!container) {
        container = commentBox.closest('[data-urn]');
    }

    if (container) {
        // Try standard text selectors inside the container
        const textElement = container.querySelector('.update-components-text, .feed-shared-update-v2__description-wrapper, .feed-shared-text-view, .break-words');
        if (textElement) return textElement.innerText;
        
        // If specific text class missing, try the container's raw text (cleaned up)
        return container.innerText.split('\n').slice(0, 5).join('\n'); // First 5 lines
    }

    return null;
}

// --- HELPER: Insert Text into LinkedIn Editor ---
function insertReply(commentBox, text) {
    commentBox.focus();
    
    // Method 1: The Standard "User Typing" Simulation (Best for React/Quill)
    const success = document.execCommand('insertText', false, text);
    
    // Method 2: Clipboard Fallback (If Method 1 is blocked by CSP)
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
            if (response && response.success) {
                // We assume the first suggestion is the best one
                insertReply(commentBox, response.data.suggestions[0]);
            } else {
                alert("Error: " + (response ? response.error : "Check Backend"));
            }
        });
    });

    parent.appendChild(btn);
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