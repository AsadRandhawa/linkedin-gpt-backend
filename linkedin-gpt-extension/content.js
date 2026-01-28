console.log("LinkedIn GPT Extension: v5 Enhanced UI");

// --- HELPER 1: Read Post Text (Enhanced) ---
function getPostText(commentBox) {
    console.log("Attempting to extract post text...");

    // Strategy 1: Find the post container
    let container = commentBox.closest('.feed-shared-update-v2, .artdeco-modal, .occludable-update');

    // Strategy 2: If not found, look for any parent with a 'data-urn'
    if (!container) {
        container = commentBox.closest('[data-urn]');
    }

    if (container) {
        // Try multiple selectors for post text (LinkedIn changes these frequently)
        const selectors = [
            '.feed-shared-update-v2__description .break-words',
            '.feed-shared-text__text-view',
            '.feed-shared-inline-show-more-text',
            '.update-components-text',
            '.feed-shared-update-v2__description-wrapper',
            '.feed-shared-text-view',
            '.break-words span[dir="ltr"]',
            '.feed-shared-text'
        ];

        for (const selector of selectors) {
            const textElement = container.querySelector(selector);
            if (textElement && textElement.innerText.trim().length > 20) {
                console.log("✅ Found post text using selector:", selector);
                return textElement.innerText.trim();
            }
        }

        // Fallback: Get text but filter out noise
        const allText = container.innerText;
        const lines = allText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 10)
            .filter(line => !line.match(/^(Like|Comment|Share|Send|Repost|Follow|Connect)$/i))
            .filter(line => !line.match(/^\d+\s*(reactions?|comments?|shares?)$/i));

        if (lines.length > 0) {
            const postText = lines.slice(0, 8).join('\n');
            console.log("✅ Extracted post text (fallback)");
            return postText;
        }
    }

    console.log("❌ Could not extract post text automatically");
    return null;
}

// --- HELPER 2: Insert Text into LinkedIn Editor ---
function insertReply(commentBox, text) {
    commentBox.focus();

    // Method 1: Standard "User Typing" Simulation
    const success = document.execCommand('insertText', false, text);

    // Method 2: Clipboard Fallback
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
        background: linear-gradient(135deg, #0a66c2 0%, #004182 100%);
        color: white; border-radius: 20px; border: none; 
        padding: 8px 16px; font-weight: 600; font-size: 14px; cursor: pointer; 
        margin-top: 8px; display: inline-block; z-index: 1000;
        box-shadow: 0 2px 8px rgba(10, 102, 194, 0.3);
        transition: all 0.2s ease;
    `;

    btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateY(-1px)';
        btn.style.boxShadow = '0 4px 12px rgba(10, 102, 194, 0.4)';
    });

    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translateY(0)';
        btn.style.boxShadow = '0 2px 8px rgba(10, 102, 194, 0.3)';
    });

    btn.addEventListener('click', () => {
        let postText = getPostText(commentBox);

        // Fallback: If auto-detection fails, ask the user
        if (!postText) {
            postText = prompt("I couldn't auto-read the post (LinkedIn changed their layout). \n\nPlease copy & paste the post text here:");
            if (!postText) return;
        }

        btn.innerText = "⏳ Thinking...";
        btn.disabled = true;

        chrome.runtime.sendMessage({ action: "fetchSuggestions", postContent: postText }, (response) => {
            btn.innerText = "✨ AI Reply";
            btn.disabled = false;

            console.log("Full response received:", response);

            if (chrome.runtime.lastError) {
                console.error("Chrome runtime error:", chrome.runtime.lastError);
                alert("Connection error. Please refresh the page.");
                return;
            }

            if (response && response.success) {
                console.log("Response data:", response.data);

                if (response.data && response.data.suggestions && response.data.suggestions.length > 0) {
                    const suggestions = response.data.suggestions;
                    console.log("✅ Valid suggestions found:", suggestions.length, suggestions);
                    showSuggestionModal(suggestions, commentBox);
                } else {
                    console.error("Empty suggestions received:", JSON.stringify(response, null, 2));
                    alert("The AI replied, but the suggestion list was empty. Check console for details.");
                }
            } else {
                console.error("Server error response:", response);
                const errorMsg = response ? response.error : "Unknown Error";
                alert("Error: " + errorMsg);
            }
        });
    });

    parent.appendChild(btn);
}

// --- HELPER 3: Show Suggestion Modal (Enhanced UI) ---
function showSuggestionModal(suggestions, commentBox) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.6); z-index: 10000; display: flex; 
        align-items: center; justify-content: center;
        backdrop-filter: blur(4px);
        animation: fadeIn 0.2s ease;
    `;

    // Create modal content
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white; border-radius: 12px; padding: 28px; 
        max-width: 650px; width: 90%; 
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        animation: slideUp 0.3s ease;
    `;

    const title = document.createElement('h3');
    title.innerText = '✨ AI Comment Suggestions';
    title.style.cssText = `
        margin: 0 0 20px 0; color: #0a66c2; font-size: 20px; 
        font-weight: 700; font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto;
    `;
    modal.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.innerText = 'Click on any suggestion to use it:';
    subtitle.style.cssText = `
        margin: 0 0 16px 0; color: #666; font-size: 14px;
        font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto;
    `;
    modal.appendChild(subtitle);

    // Add each suggestion as a clickable option
    suggestions.forEach((suggestion, index) => {
        const option = document.createElement('div');
        option.style.cssText = `
            padding: 16px; margin-bottom: 12px; border: 2px solid #e0e0e0; 
            border-radius: 10px; cursor: pointer; transition: all 0.2s ease;
            background: white; font-size: 15px; line-height: 1.5;
            color: #000; font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto;
        `;

        const badge = document.createElement('span');
        badge.innerText = `${index + 1}`;
        badge.style.cssText = `
            display: inline-block; background: #0a66c2; color: white;
            width: 24px; height: 24px; border-radius: 50%; text-align: center;
            line-height: 24px; font-size: 12px; font-weight: 700;
            margin-right: 10px;
        `;

        const text = document.createElement('span');
        text.innerText = suggestion;
        text.style.cssText = 'color: #000; font-weight: 500;';

        option.appendChild(badge);
        option.appendChild(text);

        option.addEventListener('mouseenter', () => {
            option.style.borderColor = '#0a66c2';
            option.style.backgroundColor = '#f3f6f8';
            option.style.transform = 'translateX(4px)';
        });

        option.addEventListener('mouseleave', () => {
            option.style.borderColor = '#e0e0e0';
            option.style.backgroundColor = 'white';
            option.style.transform = 'translateX(0)';
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
        margin-top: 16px; padding: 10px 20px; background: #666; color: white; 
        border: none; border-radius: 8px; cursor: pointer; width: 100%;
        font-size: 14px; font-weight: 600; transition: all 0.2s ease;
        font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto;
    `;
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = '#555';
    });
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = '#666';
    });
    closeBtn.addEventListener('click', () => document.body.removeChild(overlay));
    modal.appendChild(closeBtn);

    overlay.appendChild(modal);

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

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