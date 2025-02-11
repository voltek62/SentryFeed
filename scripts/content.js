function getApiKey() {
    return new Promise((resolve) => {
        chrome.storage.sync.get("groqApiKey", (data) => {
            if (data.groqApiKey) {
                resolve(data.groqApiKey);
            } else {
                console.warn("GROQ API key not found in storage!");
                resolve(null);
            }
        });
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function initExtension() {
    cringeGuardExistingPosts();
    observeNewPosts();
}

function cringeGuardThisPost(post) {
    const parentDiv = post.closest('.feed-shared-update-v2__control-menu-container');

    if (parentDiv) {
        const wrapper = document.createElement('div');
        while (parentDiv.firstChild) {
            wrapper.appendChild(parentDiv.firstChild);
        }

        wrapper.style.filter = 'blur(10px)';
        wrapper.style.transition = 'all 0.3s ease';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        wrapper.style.position = 'relative';
        wrapper.style.opacity = '0.95';

        parentDiv.style.position = 'relative';

        const button = document.createElement('button');
        button.innerText = 'Click to View';
        button.style.position = 'absolute';
        button.style.top = '50%';
        button.style.left = '50%';
        button.style.transform = 'translate(-50%, -50%)';
        button.style.zIndex = '10';
        button.style.backgroundColor = '#0a66c2';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.padding = '12px 24px';
        button.style.fontSize = '14px';
        button.style.borderRadius = '24px';
        button.style.cursor = 'pointer';
        button.style.fontWeight = '600';
        button.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
        button.style.transition = 'all 0.2s ease';

        button.onmouseover = () => {
            button.style.backgroundColor = '#004182';
            button.style.boxShadow = '0 0 12px rgba(0,0,0,0.15)';
        };

        button.onmouseout = () => {
            button.style.backgroundColor = '#0a66c2';
            button.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
        };

        button.addEventListener('click', () => {
            wrapper.style.filter = '';
            wrapper.style.opacity = '1';
            button.style.display = 'none';
        });

        parentDiv.appendChild(wrapper);
        parentDiv.appendChild(button);
    }
}

async function checkForCringe(post) {
    const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
    const apiKey = await getApiKey();
    if (!apiKey) return; // Stop execution if no API key

    const SYSTEM_PROMPT_PREFIX = `
        You are a LinkedIn post analyzer. Your job is to determine if a post meets the following criteria:
    `;

    const POST_CRITERIA = `
        - Selling a course with an emotional story
        - Clickbait or overly emotional stories
        - Generic life lessons without tech relevance
        - Non-tech political or social commentary
        - Personal posts with no professional context
        - Asking users to comment "interested" to get a job
        - Tagging people for engagement without substance
        - Generic advice without specifics
        - Promotional brand content or ads
        - Meme posts unrelated to tech or professional growth
        - LLM-generated text
        - Humble bragging or forced inspiration
        - Misleading information
    `;

    const prompt = `${SYSTEM_PROMPT_PREFIX} ${POST_CRITERIA}
        If any criteria are met, respond with:
        - "true: reason1, reason2, reason3" (if cringe)
        - "false: reason1, reason2, reason3" (if not cringe)
    `;

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gemma2-9b-it",
                messages: [
                    { role: "system", content: prompt },
                    { role: "user", content: post.innerText.trim() }
                ],
                temperature: 0.1
            })
        });

        const data = await response.json();
        const isCringe = data.choices[0].message.content.toLowerCase().includes('true');
        if (isCringe) {
            cringeGuardThisPost(post);
        }
        return isCringe;
    } catch (error) {
        console.error('Error checking post:', error);
        return false;
    }
}

const debouncedCheckForCringe = debounce(checkForCringe, 1000);

function cringeGuardExistingPosts() {
    const posts = document.querySelectorAll('.update-components-update-v2__commentary');
    for (const post of posts) {
        debouncedCheckForCringe(post);
    }
}

function observeNewPosts() {
    const alreadyProcessedPosts = new Set();

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const posts = node.querySelectorAll('.update-components-update-v2__commentary');
                        for (const post of posts) {
                            if (!alreadyProcessedPosts.has(post)) {
                                alreadyProcessedPosts.add(post);
                                checkForCringe(post);
                            }
                        }
                    }
                });
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

initExtension();
