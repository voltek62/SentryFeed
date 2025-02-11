document.addEventListener("DOMContentLoaded", function () {
    const apiKeyInput = document.getElementById("apiKey");
    const saveButton = document.getElementById("saveApiKey");
    const statusMessage = document.getElementById("statusMessage");

    // Load the stored API key when popup opens
    chrome.storage.sync.get("groqApiKey", function (data) {
        if (data.groqApiKey) {
            apiKeyInput.value = data.groqApiKey;
        }
    });

    // Save API key to Chrome Storage
    saveButton.addEventListener("click", function () {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            chrome.storage.sync.set({ groqApiKey: apiKey }, function () {
                statusMessage.textContent = "API Key saved successfully!";
                setTimeout(() => (statusMessage.textContent = ""), 2000);
            });
        } else {
            statusMessage.textContent = "Please enter a valid API Key!";
            statusMessage.style.color = "red";
        }
    });
});
