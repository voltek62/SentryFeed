document.addEventListener("DOMContentLoaded", function () {
    const apiKeyInput = document.getElementById("api-key");
    const saveButton = document.getElementById("save-button");
    const successMessage = document.createElement("p");

    successMessage.innerText = "✅ API Key saved successfully!";
    successMessage.style.color = "#0077b5";
    successMessage.style.fontSize = "14px";
    successMessage.style.fontWeight = "500";
    successMessage.style.textAlign = "center";
    successMessage.style.marginTop = "10px";
    successMessage.style.display = "none";

    document.querySelector(".api-key-section").appendChild(successMessage);

    // Load API key from Chrome storage
    chrome.storage.sync.get("groqApiKey", function (data) {
        if (data.groqApiKey) {
            apiKeyInput.value = data.groqApiKey;
        }
    });

    // Save API key to Chrome storage
    saveButton.addEventListener("click", function () {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) return;

        chrome.storage.sync.set({ groqApiKey: apiKey }, function () {
            successMessage.style.display = "block";
            successMessage.style.opacity = "1";

            // Hide message after 3 seconds
            setTimeout(() => {
                successMessage.style.opacity = "0";
                setTimeout(() => {
                    successMessage.style.display = "none";
                }, 300);
            }, 3000);
        });
    });

    // Ajout des éléments pour gérer les critères
    const DEFAULT_CRITERIA = [
        "Selling a course, and using some emotional unrelated story",
        "Overly emotional or clickbait stories with no tech-related content",
        "Using life lessons or motivational quotes that aren't tied to personal growth in tech",
        "Non-tech political or social commentary that doesn't add value",
        "Posts that are purely personal without a professional context",
        "Asking to 'Comment interested' if you want to get the job",
        "Tag 3 people or like if you agree with no substance",
        "Generalized or redundant content",
        "Any brand promotional content / Ad",
        "Overly generic advice without specific tools or frameworks",
        "Viral memes not related to professional goals",
        "Written by an LLM",
        "Overly personal or TMI content",
        "Excessive self-promotion or bragging",
        "Inappropriate workplace behavior",
        "Forced or artificial inspiration",
        "Obvious humble bragging",
        "Inappropriate emotional display for professional setting",
        "Contains misleading or out-of-context information"
    ];

    const criteriaSection = document.createElement("div");
    criteriaSection.className = "criteria-section";
    criteriaSection.innerHTML = `
        <h3>Critères de détection</h3>
        <div id="criteria-list"></div>
        <button id="add-criterion">Ajouter un critère</button>
        <button id="reset-criteria">Réinitialiser les critères</button>
    `;

    document.querySelector(".api-key-section").after(criteriaSection);

    const criteriaList = document.getElementById("criteria-list");
    const addCriterionButton = document.getElementById("add-criterion");
    const resetCriteriaButton = document.getElementById("reset-criteria");

    // Charger les critères existants
    chrome.storage.sync.get("cringe_criteria", function (data) {
        const criteria = data.cringe_criteria || DEFAULT_CRITERIA;
        renderCriteria(criteria);
    });

    function renderCriteria(criteria) {
        criteriaList.innerHTML = "";
        criteria.forEach((criterion, index) => {
            const criterionDiv = document.createElement("div");
            criterionDiv.className = "criterion-item";
            criterionDiv.innerHTML = `
                <input type="text" value="${criterion}" />
                <button class="delete-criterion" data-index="${index}">×</button>
            `;
            criteriaList.appendChild(criterionDiv);
        });
        saveCriteria();
    }

    function saveCriteria() {
        const criteria = Array.from(criteriaList.querySelectorAll('input')).map(input => input.value);
        chrome.storage.sync.set({ cringe_criteria: criteria });
    }

    addCriterionButton.addEventListener("click", () => {
        const criteria = Array.from(criteriaList.querySelectorAll('input')).map(input => input.value);
        criteria.push("");
        renderCriteria(criteria);
    });

    resetCriteriaButton.addEventListener("click", () => {
        renderCriteria(DEFAULT_CRITERIA);
    });

    criteriaList.addEventListener("input", (e) => {
        if (e.target.tagName === "INPUT") {
            saveCriteria();
        }
    });

    criteriaList.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-criterion")) {
            const index = e.target.dataset.index;
            const criteria = Array.from(criteriaList.querySelectorAll('input')).map(input => input.value);
            criteria.splice(index, 1);
            renderCriteria(criteria);
        }
    });

    // Ajouter après le code existant
    const style = document.createElement('style');
    style.textContent = `
        .criteria-section {
            margin-top: 20px;
            padding: 15px;
            border-top: 1px solid #e0e0e0;
        }

        .criterion-item {
            display: flex;
            margin-bottom: 10px;
            gap: 10px;
        }

        .criterion-item input {
            flex: 1;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
        }

        .delete-criterion {
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            padding: 0 10px;
            font-size: 18px;
        }

        #add-criterion, #reset-criteria {
            background: #0077b5;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 16px;
            margin-right: 10px;
            cursor: pointer;
        }

        #reset-criteria {
            background: #666;
        }
    `;
    document.head.appendChild(style);
});
