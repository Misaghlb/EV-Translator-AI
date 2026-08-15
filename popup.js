document.addEventListener('DOMContentLoaded', () => {
    const modelSelect = document.getElementById('model-select');
    const customModelInput = document.getElementById('custom-model-input');

    if (modelSelect && customModelInput) {
        modelSelect.addEventListener('change', () => {
            if (modelSelect.value === 'custom') {
                customModelInput.style.display = 'block';
                customModelInput.focus();
            } else {
                customModelInput.style.display = 'none';
            }
        });
    }

    // Load saved settings
    chrome.storage.sync.get(['apiKey', 'translationPrompt', 'targetLanguage', 'excludeTweetLang', 'selectedModel'], (result) => {
        const savedApiKey = result.apiKey || '';
        const savedLanguage = result.targetLanguage || 'Persian';
        const savedModel = result.selectedModel || DEFAULT_MODEL;
        let savedPrompt = result.translationPrompt;
        let shouldSave = false;
        if (!savedPrompt || savedPrompt.trim() === "") {
            savedPrompt = DEFAULT_TRANSLATION_PROMPT;
            shouldSave = true;
        }
        // Set saved values
        document.getElementById('api-key').value = savedApiKey;
        document.getElementById('translation-prompt').value = savedPrompt;
        
        // Set the selected model
        if (modelSelect) {
            let matched = false;
            for (let i = 0; i < modelSelect.options.length; i++) {
                if (modelSelect.options[i].value === savedModel) {
                    modelSelect.selectedIndex = i;
                    matched = true;
                    break;
                }
            }
            if (!matched && savedModel) {
                modelSelect.value = 'custom';
                if (customModelInput) {
                    customModelInput.style.display = 'block';
                    customModelInput.value = savedModel;
                }
            }
        }

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
        
        let selectedModel = modelSelect ? modelSelect.value : DEFAULT_MODEL;
        if (selectedModel === 'custom' && customModelInput) {
            selectedModel = customModelInput.value.trim() || DEFAULT_MODEL;
        }

        chrome.storage.sync.set({ 
            apiKey,
            translationPrompt,
            targetLanguage,
            excludeTweetLang,
            selectedModel
        }, () => {
            const status = document.getElementById('status');
            status.style.display = 'block';
            setTimeout(() => {
                status.style.display = 'none';
            }, 2000);
        });
    });

    // Screenshot Full Page
    document.getElementById('screenshot-full').addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'screenshot_full_translate' });
            }
        });
    });

    // Screenshot Area
    document.getElementById('screenshot-area').addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'screenshot_area_translate' });
            }
        });
    });
});
