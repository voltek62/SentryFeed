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

function checkForCringe(post) {
    // TODO - make api call and check for cringe
    cringeGuardThisPost(post);
}

function cringeGuardExistsingPosts() {
    const posts = document.querySelectorAll('.update-components-update-v2__commentary');
    for (const post of posts) {
        checkForCringe(post);
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