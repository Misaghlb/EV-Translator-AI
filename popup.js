document.addEventListener('DOMContentLoaded', () => {
    // Load saved settings
    chrome.storage.sync.get(['apiKey', 'translationPrompt', 'targetLanguage', 'excludeTweetLang'], (result) => {
        const savedApiKey = result.apiKey || '';
        const savedLanguage = result.targetLanguage || 'Persian';
        let savedPrompt = result.translationPrompt;
        let shouldSave = false;
        if (!savedPrompt || savedPrompt.trim() === "") {
            savedPrompt = DEFAULT_TRANSLATION_PROMPT;
            shouldSave = true;
        }
        // Set saved values
        document.getElementById('api-key').value = savedApiKey;
        document.getElementById('translation-prompt').value = savedPrompt;
        // Set the selected language
        const languageSelect = document.getElementById('target-language');
        if (languageSelect) {
            for (let i = 0; i < languageSelect.options.length; i++) {
                if (languageSelect.options[i].value === savedLanguage) {
                    languageSelect.selectedIndex = i;
                    break;
                }
            }
        }
        // Save the default prompt if it was missing
        if (shouldSave) {
            chrome.storage.sync.set({ translationPrompt: savedPrompt });
        }
        // Set the exclude-lang select
        const excludeLangSelect = document.getElementById('exclude-lang');
        if (excludeLangSelect) {
            excludeLangSelect.value = result.excludeTweetLang || '';
        }
    });

    // Save settings when button is clicked
    document.getElementById('save-settings').addEventListener('click', () => {
        const apiKey = document.getElementById('api-key').value.trim();
        const translationPrompt = document.getElementById('translation-prompt').value.trim();
        const targetLanguage = document.getElementById('target-language').value;
        const excludeTweetLang = document.getElementById('exclude-lang').value;
        
        chrome.storage.sync.set({ 
            apiKey,
            translationPrompt,
            targetLanguage,
            excludeTweetLang
        }, () => {
            const status = document.getElementById('status');
            status.style.display = 'block';
            setTimeout(() => {
                status.style.display = 'none';
            }, 2000);
        });
    });
});
