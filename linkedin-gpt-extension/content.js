console.log("LinkedIn GPT Extension: v6 - Super Aggressive Detection");

// --- HELPER 1: Read Post Text (Super Aggressive) ---
function getPostText(commentBox) {
    console.log("🔍 Starting super aggressive post text extraction...");

    // Method 1: Traverse up and look everywhere
    let element = commentBox;
    for (let level = 0; level < 20; level++) {
        if (!element) break;

        // Try to find any element with substantial text content
        const allDivs = element.querySelectorAll('div, span, p');
        for (const div of allDivs) {
            const text = div.innerText?.trim() || '';

            // Check if this looks like post content
            if (text.length > 50 && text.length < 5000) {
                // Filter out obvious UI elements
                const firstLine = text.split('\n')[0];
                if (!firstLine.match(/^(Like|Comment|Share|Send|Repost|Follow|Connect|Add a comment|Most relevant|Home|My Network)$/i)) {
                    // Count how many lines of real content
                    const meaningfulLines = text.split('\n')
                        .filter(line => line.trim().length > 10)
                        .filter(line => !line.match(/^(Like|Comment|Share|Send|Repost)$/i));

                    if (meaningfulLines.length >= 1) {
                        console.log("✅ Found post text! Length:", text.length);
                        console.log("📝 Preview:", text.substring(0, 100));
                        return text;
                    }
                }
            }
        }

        element = element.parentElement;
    }

    console.log("❌ Auto-detection failed");
    return null;
}

// --- HELPER 2: Insert Text into LinkedIn Editor ---
function insertReply(commentBox, text) {
    commentBox.focus();
    const success = document.execCommand('insertText', false, text);
    if (!success) {
        navigator.clipboard.writeText(text).then(() => {
            alert("✨ Suggestion copied to clipboard! (Paste it manually)");
        });
    }
}

// --- MAIN: Inject Button ---
function injectButton(commentBox) {
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
        console.log("🎯 AI Reply button clicked");

        let postText = getPostText(commentBox);

        if (!postText || postText.length < 20) {
            console.log("⚠️ Auto-detection failed or text too short, asking user");
            postText = prompt("Please paste the LinkedIn post text here:");
            if (!postText) {
                console.log("❌ User cancelled");
                return;
            }
        }

        console.log("📤 Sending to backend, text length:", postText.length);
        btn.innerText = "⏳ Thinking...";
        btn.disabled = true;

        chrome.runtime.sendMessage({ action: "fetchSuggestions", postContent: postText }, (response) => {
            btn.innerText = "✨ AI Reply";
            btn.disabled = false;

            console.log("📥 Response received:", response);

            if (chrome.runtime.lastError) {
                console.error("❌ Chrome runtime error:", chrome.runtime.lastError);
                alert("Connection error. Please refresh the page.");
                return;
            }

            if (response && response.success) {
                if (response.data && response.data.suggestions && response.data.suggestions.length > 0) {
                    console.log("✅ Got", response.data.suggestions.length, "suggestions");
                    showSuggestionModal(response.data.suggestions, commentBox);
                } else {
                    console.error("❌ Empty suggestions");
                    alert("No suggestions received. Check console.");
                }
            } else {
                console.error("❌ Server error:", response);
                alert("Error: " + (response ? response.error : "Unknown"));
            }
        });
    });

    parent.appendChild(btn);
}

// --- HELPER 3: Show Suggestion Modal (Enhanced UI) ---
function showSuggestionModal(suggestions, commentBox) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.6); z-index: 10000; display: flex; 
        align-items: center; justify-content: center;
        backdrop-filter: blur(4px);
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white; border-radius: 12px; padding: 28px; 
        max-width: 650px; width: 90%; 
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    `;

    const title = document.createElement('h3');
    title.innerText = '✨ AI Comment Suggestions';
    title.style.cssText = `
        margin: 0 0 20px 0; color: #0a66c2; font-size: 20px; 
        font-weight: 700; font-family: -apple-system, system-ui, "Segoe UI", Roboto;
    `;
    modal.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.innerText = 'Click on any suggestion to use it:';
    subtitle.style.cssText = `
        margin: 0 0 16px 0; color: #666; font-size: 14px;
        font-family: -apple-system, system-ui, "Segoe UI", Roboto;
    `;
    modal.appendChild(subtitle);

    suggestions.forEach((suggestion, index) => {
        const option = document.createElement('div');
        option.style.cssText = `
            padding: 16px; margin-bottom: 12px; border: 2px solid #e0e0e0; 
            border-radius: 10px; cursor: pointer; transition: all 0.2s ease;
            background: white;
        `;

        const badge = document.createElement('span');
        badge.innerText = `${index + 1}`;
        badge.style.cssText = `
            display: inline-block; background: #0a66c2; color: white;
            width: 24px; height: 24px; border-radius: 50%; text-align: center;
            line-height: 24px; font-size: 12px; font-weight: 700;
            margin-right: 10px; vertical-align: top;
        `;

        const text = document.createElement('span');
        text.innerText = suggestion;
        text.style.cssText = `
            color: #000; font-weight: 500; font-size: 15px; line-height: 1.6;
            font-family: -apple-system, system-ui, "Segoe UI", Roboto;
            display: inline-block; width: calc(100% - 40px); vertical-align: top;
        `;

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

    const closeBtn = document.createElement('button');
    closeBtn.innerText = 'Cancel';
    closeBtn.style.cssText = `
        margin-top: 16px; padding: 10px 20px; background: #666; color: white; 
        border: none; border-radius: 8px; cursor: pointer; width: 100%;
        font-size: 14px; font-weight: 600; transition: all 0.2s ease;
        font-family: -apple-system, system-ui, "Segoe UI", Roboto;
    `;
    closeBtn.addEventListener('mouseenter', () => closeBtn.style.background = '#555');
    closeBtn.addEventListener('mouseleave', () => closeBtn.style.background = '#666');
    closeBtn.addEventListener('click', () => document.body.removeChild(overlay));
    modal.appendChild(closeBtn);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

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
document.querySelectorAll('div[role="textbox"]').forEach(injectButton);