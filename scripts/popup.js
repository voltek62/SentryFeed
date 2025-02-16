document.addEventListener("DOMContentLoaded", function () {
    // check the stored API key when popup opens
    chrome.storage.sync.get("groqApiKey", function (data) {
        const errorCard = document.querySelector(".error-card");

        if (data.groqApiKey) {
            errorCard.style.display = "none";
        }
    });

    // toggle swish for cringe guard
    const toggleSwitch = document.getElementById("toggle-switch");

    // Load initial state from Chrome storage
    chrome.storage.sync.get("isEnabled", function (data) {
        toggleSwitch.checked = data.isEnabled ?? true; // Default to true
    });

    // Listen for toggle changes
    toggleSwitch.addEventListener("change", function () {
        chrome.storage.sync.set({ isEnabled: toggleSwitch.checked });
    });

    chrome.storage.sync.get(["cringeCount", "timeSavedInMinutes"], function (data) {
        document.getElementById("cringe-count").innerText = data.cringeCount || 0;
        document.getElementById("time-saved").innerText = Math.ceil(data.timeSavedInMinutes || 0) + "m";
    });

    // take user to the settings page
    const settingsButton = document.querySelector('.settings-icon');
    settingsButton.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
});