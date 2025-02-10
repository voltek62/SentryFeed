const GROQ_API_KEY = '<GROQ_API_KEY_GOES_HERE>';

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
    cringeGuardExistsingPosts();
    observeNewPosts();
}

function cringeGuardThisPost(post) {
    const parentDiv = post.closest('.feed-shared-update-v2__control-menu-container');

    if (parentDiv) {
        // Create a wrapper div to hold the blurred content
        const wrapper = document.createElement('div');

        // Move all existing content from parentDiv to wrapper
        while (parentDiv.firstChild) {
            wrapper.appendChild(parentDiv.firstChild);
        }

        // Style the wrapper with a more subtle blur
        wrapper.style.filter = 'blur(10px)';  // Reduced blur for better readability
        wrapper.style.transition = 'all 0.3s ease';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';

        // Add a slight dimming overlay effect
        wrapper.style.position = 'relative';
        wrapper.style.opacity = '0.95';  // Slight dimming of the content

        // Style the parent div
        parentDiv.style.position = 'relative';

        // Create the button with LinkedIn-style design
        const button = document.createElement('button');
        button.innerText = 'Click to View';  // More professional text
        button.style.position = 'absolute';
        button.style.top = '50%';
        button.style.left = '50%';
        button.style.transform = 'translate(-50%, -50%)';
        button.style.zIndex = '10';

        // LinkedIn-inspired button styling
        button.style.backgroundColor = '#0a66c2';  // LinkedIn blue
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.padding = '12px 24px';
        button.style.fontSize = '14px';
        button.style.borderRadius = '24px';  // Rounded corners like LinkedIn
        button.style.cursor = 'pointer';
        button.style.fontWeight = '600';
        button.style.fontFamily = '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Fira Sans", Ubuntu, Oxygen, "Oxygen Sans", Cantarell';  // LinkedIn font stack
        button.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';  // Subtle shadow
        button.style.transition = 'all 0.2s ease';

        // Hover effect
        button.onmouseover = () => {
            button.style.backgroundColor = '#004182';  // Darker blue on hover
            button.style.boxShadow = '0 0 12px rgba(0,0,0,0.15)';
        };

        button.onmouseout = () => {
            button.style.backgroundColor = '#0a66c2';
            button.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
        };

        // Add click event
        button.addEventListener('click', () => {
            wrapper.style.filter = '';
            wrapper.style.opacity = '1';
            button.style.display = 'none';
        });

        // Add the wrapper and button to parentDiv
        parentDiv.appendChild(wrapper);
        parentDiv.appendChild(button);
    }
}

async function checkForCringe(post) {
    const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';


    const SYSTEM_PROMPT_PREFIX = `
        You are a linkedin post analyser. Your job is to decide if the content of a linkedin post is met with the following criteria:.
    `;

    const POST_CRITERIA = `
        - Selling a course, and using some emotional unrelated story
        - Overly emotional or clickbait stories with no tech-related content
        - Using "life lessons" or motivational quotes that aren't tied to personal growth in tech or learning.
        - Non-tech political or social commentary that doesn’t add value to professional discussions
        - Posts that are purely personal (vacations, family pictures) without a professional context
        - asking to "Comment 'interested' if you want to get the job!"
        - "Tag 3 people" or "like if you agree" with no substance or tech-related discussions
        - Generalized or redundant content
        - Any brand promotional content / Ad
        - Overly generic advice like "Keep learning every day" without mentioning any specific tools, frameworks, or learning paths.
        - Anything that’s just a viral meme or random content not related to a professional or technical goal.
        - Written by an LLM
        - Overly personal or TMI content
        - Excessive self-promotion or bragging
        - Inappropriate workplace behavior
        - Forced or artificial inspiration
        - Obvious humble bragging
        - Inappropriate emotional display for professional setting
        - Contains misleading or out-of-context information
    `;

    const prompt = `${SYSTEM_PROMPT_PREFIX} ${POST_CRITERIA}
        If any of the above criteria are met, the tweet should be considered as a cringe post. Analyze this post and respond with ONLY "true" if the post is cringe-worthy or "false" if it's not. No other explanation needed. Max 1 word.

        Respond EXCLUSIVELY using one of these formats:
        - "true: reason1, reason2, reason3" (if cringe)
        - "false: reason1, reason2, reason3" (if not cringe)`
    ;

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gemma2-9b-it",
                messages: [
                    {
                        role: "system",
                        content: prompt
                    },
                    {
                        role: "user",
                        content: post.innerText.trim()
                    }],
                temperature: 0.1 // Lowering temperature for more consistent responses
            })
        });

        const data = await response.json();
        const isCringe = data.choices[0].message.content.toLowerCase().includes('true');
        return isCringe;
    } catch (error) {
        console.error('Error checking post:', error);
        return false; // Fail safe - better to show the post than block incorrectly
    }
}

const debouncedCheckForCringe = debounce(checkForCringe, 1000);

function cringeGuardExistsingPosts() {
    const posts = document.querySelectorAll('.update-components-update-v2__commentary');
    for (const post of posts) {
        // Adding a debounced wrapper if as I'm calling this frequently
        const isCringe = debouncedCheckForCringe(post);
        if (isCringe) {
            cringeGuardThisPost(post);
        }
    }
}

function observeNewPosts() {
    const alreadyProcessedPosts = new Set();

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // for some reason - MutationObserver is picking up same post multiple times. bcz of childlist?
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