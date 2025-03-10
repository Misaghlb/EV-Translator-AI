// Function to add context menu
let isMouseDown = false;
let selectionTimer = null;
const SELECTION_DELAY = 300; // ms
let lastSelectedText = ''; // Store the last selected text

// Track mouse down state
document.addEventListener('mousedown', function(event) {
    // Don't remove the button if clicking on it
    if (event.target.id === 'translate-selected-text') {
        return;
    }
    
    isMouseDown = true;
    
    // Clear any existing selection timer
    if (selectionTimer) {
        clearTimeout(selectionTimer);
        selectionTimer = null;
    }
    
    // Remove any existing translate button when starting a new selection
    let translateButton = document.getElementById('translate-selected-text');
    if (translateButton) {
        translateButton.remove();
    }
});

// Handle mouse up - this is when we'll check for selection
document.addEventListener('mouseup', function(event) {
    // Don't process if clicking on the translate button
    if (event.target.id === 'translate-selected-text') {
        return;
    }
    
    isMouseDown = false;
    
    // Wait a moment after mouse up to allow browser to complete selection
    // This is especially important for triple-clicks
    selectionTimer = setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        if (selectedText) {
            // Check if this might be a paragraph selection (from triple-click)
            enhanceSelectionIfNeeded(selection);
            
            // Get the potentially enhanced selection
            const enhancedText = window.getSelection().toString().trim();
            lastSelectedText = enhancedText; // Store for later use
            
            // Show the translation button
            showTranslationButton(event, enhancedText);
        }
    }, SELECTION_DELAY);
});

// Function to enhance selection if it appears to be from a triple-click
function enhanceSelectionIfNeeded(selection) {
    // Disabled to maintain default browser triple-click behavior
    return;
}

// Function to show the translation button
function showTranslationButton(event, selectedText) {
    if (!selectedText) return;
    
    // Remove any existing button first
    let existingButton = document.getElementById('translate-selected-text');
    if (existingButton) {
        existingButton.remove();
    }
    
    // Create a new button
    let translateButton = document.createElement('button');
    translateButton.id = 'translate-selected-text';
    translateButton.textContent = 'Translate';
    translateButton.style.position = 'fixed';
    translateButton.style.top = event.clientY + 'px';
    translateButton.style.left = event.clientX + 'px';
    translateButton.style.zIndex = '1000';
    translateButton.style.backgroundColor = '#4CAF50';
    translateButton.style.color = 'white';
    translateButton.style.padding = '5px 10px';
    translateButton.style.border = 'none';
    translateButton.style.borderRadius = '5px';
    translateButton.style.cursor = 'pointer';
    
    // Prevent the button from being removed when clicked
    translateButton.addEventListener('mousedown', function(e) {
        e.stopPropagation();
    });
    
    translateButton.addEventListener('click', function(e) {
        e.stopPropagation();
        performSelectionTranslation(selectedText);
        translateButton.remove();
    });
    
    document.body.appendChild(translateButton);
    
    // Add a global click listener to remove the button when clicking elsewhere
    // But use setTimeout to avoid immediate triggering
    setTimeout(() => {
        const clickOutsideHandler = function(e) {
            if (e.target.id !== 'translate-selected-text') {
                let button = document.getElementById('translate-selected-text');
                if (button) {
                    button.remove();
                }
                document.removeEventListener('click', clickOutsideHandler);
            }
        };
        document.addEventListener('click', clickOutsideHandler);
    }, 100);
}

// Function to perform translation of selected text
async function performSelectionTranslation(selectedText) {
    if (selectedText) {
        let translation = await translateText(selectedText);
        if (translation) {
            displayTranslation(translation);
        } else {
            alert('Translation failed.');
        }
    }
}

// Function to display translation in a new box
function displayTranslation(translation) {
    let translationBox = document.getElementById('translation-box');
    if (!translationBox) {
        translationBox = document.createElement('div');
        translationBox.id = 'translation-box';
        translationBox.style.position = 'fixed';
        translationBox.style.backgroundColor = 'white'; // Solid white background
        translationBox.style.border = '1px solid #ccc'; // Light gray border
        translationBox.style.zIndex = '1000';
        translationBox.style.padding = '15px'; // Increased padding for better spacing
        translationBox.style.borderRadius = '8px'; // Rounded corners
        translationBox.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2)'; // Subtle shadow for depth
        translationBox.style.minWidth = '300px'; // Minimum width for better readability
        translationBox.style.maxWidth = '600px'; // Increased maximum width
        translationBox.style.width = 'auto'; // Allow width to adjust based on content
        translationBox.style.top = '20%'; // Centered vertically
        translationBox.style.left = '50%'; // Centered horizontally
        translationBox.style.transform = 'translate(-50%, -20%)'; // Adjust for centering
        translationBox.style.textAlign = 'right'; // Right align text for Persian
        translationBox.style.fontFamily = 'Segoe UI, Tahoma, sans-serif'; // Original font
        translationBox.style.fontSize = '16px'; // Increased font size for better readability
        translationBox.style.color = '#333'; // Darker text color for contrast
        translationBox.style.direction = 'rtl'; // Right-to-left for Persian text

        // Close button
        let closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '5px';
        closeButton.style.right = '5px';
        closeButton.style.backgroundColor = '#f44336'; // Red background for close button
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '5px';
        closeButton.style.cursor = 'pointer';
        closeButton.addEventListener('click', function() {
            document.body.removeChild(translationBox);
        });
        translationBox.appendChild(closeButton);

        // Add the translation text
        let translationText = document.createElement('p');
        translationText.textContent = translation;
        translationText.style.marginTop = '30px'; // Space above the text
        translationText.style.color = 'black'; // Text color

        translationBox.appendChild(translationText);
        document.body.appendChild(translationBox);

        // Add click listener to close the box when clicking outside
        const clickOutsideHandler = function(e) {
            if (!translationBox.contains(e.target)) {
                document.body.removeChild(translationBox);
                document.removeEventListener('click', clickOutsideHandler);
            }
        };
        document.addEventListener('click', clickOutsideHandler);
    } else {
        let translationText = translationBox.querySelector('p');
        translationText.textContent = translation;
    }
}

// تابع ترجمه با استفاده از API جمینی
const translationCache = new Map();

async function translateText(text) {
    if (translationCache.has(text)) {
        return translationCache.get(text);
    }

    // Get API key and prompt from storage
    const { apiKey, translationPrompt } = await chrome.storage.sync.get(['apiKey', 'translationPrompt']);

    if (!apiKey) {
        console.error('API key not found. Please set it in the extension settings.');
        return null;
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const prompt = (translationPrompt || '').replace('<TEXT>', text);

    const payload = {
        contents: [{
            parts: [{ text: prompt }]
        }]
    };
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.status === 429) {
            // Rate limit hit - wait and retry
            await new Promise(resolve => setTimeout(resolve, 2000));
            return translateText(text);
        }

        if (!response.ok) {
            throw new Error(`Translation failed: ${response.status}`);
        }

        const result = await response.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error) {
        console.warn('مشکل در ترجمه:', error.message);
        return null;
    }
    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        const translation = result.candidates[0].content.parts[0].text;
        translationCache.set(text, translation);
        return translation;
    }
    return null;
}

async function performTranslation(tweet, textContent, lang, button) {
    button.disabled = true;
    button.textContent = 'در حال ترجمه...';

    try {
        const translation = await translateText(textContent);
        if (translation) {
            const translationBox = document.createElement('div');
            translationBox.style.marginTop = '10px';
            translationBox.style.padding = '10px';
            
            // Check if Twitter is in dark mode by looking at the background color
            const isDarkMode = document.documentElement.style.colorScheme === 'dark' || 
                               window.matchMedia('(prefers-color-scheme: dark)').matches ||
                               document.body.classList.contains('dark') ||
                               getComputedStyle(document.body).backgroundColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)/)?.[1] < 50;
            
            // Apply Twitter-like styling based on theme
            if (isDarkMode) {
                translationBox.style.backgroundColor = '#2f3336';
                translationBox.style.color = '#e7e9ea';
                translationBox.style.border = '1px solid #38444d';
            } else {
                translationBox.style.backgroundColor = '#f7f9f9';
                translationBox.style.color = '#0f1419';
                translationBox.style.border = '1px solid #eff3f4';
            }
            
            translationBox.style.borderRadius = '12px';
            translationBox.style.textAlign = 'right';
            translationBox.style.direction = 'rtl';
            translationBox.style.fontSize = '15px';
            translationBox.style.lineHeight = '1.5';
            translationBox.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
            
            // Create a container for the translation text
            const translationText = document.createElement('div');
            translationText.textContent = translation;
            translationBox.appendChild(translationText);
            
            // Add re-translate button
            const retranslateButton = document.createElement('button');
            retranslateButton.textContent = 'بازترجمه';
            retranslateButton.style.marginTop = '10px';
            retranslateButton.style.padding = '5px 10px';
            retranslateButton.style.backgroundColor = '#1d9bf0'; // Twitter blue color
            retranslateButton.style.color = 'white';
            retranslateButton.style.border = 'none';
            retranslateButton.style.borderRadius = '5px';
            retranslateButton.style.cursor = 'pointer';
            retranslateButton.style.fontSize = '13px';
            
            retranslateButton.addEventListener('click', async () => {
                retranslateButton.disabled = true;
                retranslateButton.textContent = 'در حال ترجمه...';
                
                try {
                    // Clear translation cache for this text to get a fresh translation
                    translationCache.delete(textContent);
                    const newTranslation = await translateText(textContent);
                    if (newTranslation) {
                        translationText.textContent = newTranslation;
                    }
                } catch (error) {
                    console.error('خطا در بازترجمه:', error);
                    alert('خطا در بازترجمه.');
                } finally {
                    retranslateButton.disabled = false;
                    retranslateButton.textContent = 'بازترجمه';
                }
            });
            
            translationBox.appendChild(retranslateButton);
            tweet.insertAdjacentElement('afterend', translationBox);
        } else {
            alert('خطا در ترجمه.');
        }
    } catch (error) {
        console.error('خطا در ترجمه:', error);
        alert('خطا در ترجمه.');
    } finally {
        button.disabled = false;
        button.textContent = 'ترجمه توییت';
    }
}

// Function to check if we're on Twitter/X
function isTwitterSite() {
    return window.location.hostname === 'twitter.com' || window.location.hostname === 'x.com';
}

// تابعی برای افزودن دکمه ترجمه زیر توییت‌های غیر فارسی
async function addTranslateButtons() {
    // Only add tweet translation buttons on Twitter/X
    if (!isTwitterSite()) {
        return;
    }

    // Look for tweets specifically by targeting article elements containing non-Persian text
    const tweets = document.querySelectorAll('article div[dir="auto"]:not([lang="fa"])');

    for (const tweet of tweets) {
        if (tweet.dataset.buttonAdded) continue;
        tweet.dataset.buttonAdded = true;

        const button = document.createElement('button');
        button.textContent = 'ترجمه توییت';
        button.className = 'translate-button';
        button.style.marginTop = '10px';
        button.style.padding = '5px 10px';
        button.style.backgroundColor = '#749e00';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';
        button.style.textAlign = 'right';

        button.addEventListener('click', async (event) => {
            event.stopPropagation();
            const textContent = tweet.textContent.trim();
            const lang = tweet.getAttribute('lang');
            await performTranslation(tweet, textContent, lang, button);
        });

        tweet.insertAdjacentElement('afterend', button);
    }
}

// Only observe DOM changes for tweet buttons on Twitter/X
if (isTwitterSite()) {
    const observer = new MutationObserver(debounce((mutations) => {
        addTranslateButtons();
    }, 250));

    observer.observe(document.body, {
        childList: true,
        subtree: true
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
