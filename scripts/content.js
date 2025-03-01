function getApiKeyIfEnabled() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["groqApiKey", "isEnabled"], (data) => {
            if (data.isEnabled && data.groqApiKey) {
                resolve(data.groqApiKey);
            } else {
                console.warn("GROQ API key not found or extension is disabled.");
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

async function initExtension() {
    const apiKey = await getApiKeyIfEnabled();
    if (!apiKey) {
        console.warn("GROQ API key not found. Please set your API key in the extension settings.");
        return;
    }

    // Detect which platform we're on
    const isLinkedIn = window.location.hostname.includes('linkedin.com');
    const isTwitter = window.location.hostname.includes('x.com') || window.location.hostname.includes('twitter.com');

    if (isLinkedIn) {
        initLinkedIn();
    } else if (isTwitter) {
        initTwitter();
    }
}

function initLinkedIn() {
    cringeGuardExistingPosts('linkedin');
    observeNewPosts('linkedin');
}

function initTwitter() {
    cringeGuardExistingPosts('twitter');
    observeNewPosts('twitter');
}

function getPostSelector(platform) {
    switch (platform) {
        case 'linkedin':
            return '.update-components-update-v2__commentary';
        case 'twitter':
            return '[data-testid="tweetText"]';
        default:
            return '';
    }
}

function getPostContainer(platform, post) {
    switch (platform) {
        case 'linkedin':
            return post.closest('.feed-shared-update-v2__control-menu-container');
        case 'twitter':
            return post.closest('article');
        default:
            return null;
    }
}

function cringeGuardThisPost(post, platform) {
    const parentDiv = getPostContainer(platform, post);
    if (!parentDiv) return;

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
    button.style.backgroundColor = platform === 'linkedin' ? '#0a66c2' : '#1DA1F2';
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
        button.style.backgroundColor = platform === 'linkedin' ? '#004182' : '#1991DA';
        button.style.boxShadow = '0 0 12px rgba(0,0,0,0.15)';
    };

    button.onmouseout = () => {
        button.style.backgroundColor = platform === 'linkedin' ? '#0a66c2' : '#1DA1F2';
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

async function checkForCringe(post, platform) {
    const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
    const apiKey = await getApiKeyIfEnabled();
    if (!apiKey) return;

    // Récupérer les critères personnalisés
    const criteria = await new Promise((resolve) => {
        chrome.storage.sync.get("cringe_criteria", (data) => {
            resolve(data.cringe_criteria || []);
        });
    });

    const SYSTEM_PROMPT_PREFIX = `
        You are a ${platform === 'linkedin' ? 'LinkedIn' : 'Twitter'} post analyzer. Your job is to determine if a post meets any of the following criteria:
    `;

    const criteriaText = criteria.map(c => `- ${c}`).join('\n');

    const prompt = `${SYSTEM_PROMPT_PREFIX}\n${criteriaText}\n
        If any of the above criteria are met, the post should be considered as a cringe post.`;

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
                    { role: "user", content: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Post:\n\n${post.innerText.trim()}\n\nVery briefly list if the post matches any of the defined cringe criteria. If none, conclude with POST_IS_NOT_CRINGE otherwise POST_IS_CRINGE.` }
                ],
                temperature: 0.1
            })
        });

        const data = await response.json();
        const isCringe = data.choices[0].message.content.toLowerCase().includes('post_is_cringe');
        if (isCringe) {
            cringeGuardThisPost(post, platform);
            updateCringeStats(post.innerText);
        }
        return isCringe;
    } catch (error) {
        console.error('Error checking post:', error);
        return false;
    }
}

const debouncedCheckForCringe = debounce(checkForCringe, 1000);

function cringeGuardExistingPosts(platform) {
    const selector = getPostSelector(platform);
    const posts = document.querySelectorAll(selector);
    for (const post of posts) {
        debouncedCheckForCringe(post, platform);
    }
}

function observeNewPosts(platform) {
    const alreadyProcessedPosts = new Set();
    const selector = getPostSelector(platform);

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const posts = node.querySelectorAll(selector);
                        for (const post of posts) {
                            if (!alreadyProcessedPosts.has(post)) {
                                alreadyProcessedPosts.add(post);
                                checkForCringe(post, platform);
                            }
                        }
                    }
                });
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

function estimateTimeSavedInSeconds(postText) {
    const wordCount = postText.split(/\s+/).length;

    if (wordCount <= 20) return 5;   // Short posts (~5 sec saved)
    if (wordCount <= 50) return 10;  // Medium posts (~10 sec saved)
    return 20;                       // Long posts (~20 sec saved)
}

function updateCringeStats(postText) {
    chrome.storage.sync.get(["cringeCount", "timeSavedInMinutes"], (data) => {
        const newCount = (data.cringeCount || 0) + 1;
        const estimatedTimeSavedInSeconds = estimateTimeSavedInSeconds(postText);

        const newTimeSavedInMinutes = parseFloat(data.timeSavedInMinutes || 0) + estimatedTimeSavedInSeconds / 60; // Convert to minutes

        chrome.storage.sync.set({ cringeCount: newCount, timeSavedInMinutes: newTimeSavedInMinutes });
    });
}

initExtension();
