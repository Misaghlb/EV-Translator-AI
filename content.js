// Function to add context menu
let isMouseDown = false;
let selectionTimer = null;
const SELECTION_DELAY = 300; // ms
let lastSelectedText = ''; // Store the last selected text

// Store the last position of the translation box
let lastTranslationBoxPosition = {
    top: null,
    left: null,
    positionSet: false
};

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
    selectionTimer = setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        if (selectedText) {
            // Store selected text for later use
            lastSelectedText = selectedText;
            
            // Show the translation button
            showTranslationButton(event, selectedText);
        }
    }, SELECTION_DELAY);
});

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
    // Offset the button so it doesn't appear directly under the cursor
    const OFFSET = 70;
    let top = event.clientY + OFFSET;
    let left = event.clientX + OFFSET;
    // Prevent the button from going out of viewport
    if (top > window.innerHeight - 40) top = window.innerHeight - 40;
    if (left > window.innerWidth - 100) left = window.innerWidth - 100;
    translateButton.style.top = top + 'px';
    translateButton.style.left = left + 'px';
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
        showLoadingIndicator();
        let translation = await translateText(selectedText);
        hideLoadingIndicator();
        if (translation) {
                displayTranslation(translation, selectedText);
        } else {
            alert('Translation failed.');
        }
    }
}

// Function to display translation in a new box
function displayTranslation(translation, originalText = null) {
    // Check if there's already a translation box
    const existingBox = document.getElementById('translation-box');
    
    // Create a new floating tooltip-style box or reuse existing one
    let translationBox;
    if (existingBox) {
        translationBox = existingBox;
        // Clear existing content
        while (translationBox.firstChild) {
            translationBox.removeChild(translationBox.firstChild);
        }
    } else {
        translationBox = getTranslationBoxElement();
    }
    
    // Create a container for the translation text
    const translationText = document.createElement('div');
    // Replace newline characters with <br> tags to preserve paragraph formatting
    const formattedTranslation = translation.replace(/\n/g, '<br>');
    translationText.innerHTML = formattedTranslation;
    
    // Set text direction based on target language (RTL for certain languages)
    chrome.storage.sync.get(['targetLanguage'], ({ targetLanguage }) => {
        const rtlLangs = ['arabic', 'persian', 'farsi', 'urdu', 'hebrew'];
        const lang = (targetLanguage || '').toLowerCase();
        if (rtlLangs.includes(lang)) {
            translationText.style.direction = 'rtl';
            translationText.style.textAlign = 'right';
        } else {
            translationText.style.direction = 'ltr';
            translationText.style.textAlign = 'left';
        }
    });
    
    // Add re-translate button
    const retranslateButton = document.createElement('button');
    retranslateButton.textContent = 'Re-translate';
    retranslateButton.style.marginTop = '10px';
    retranslateButton.style.padding = '5px 10px';
    retranslateButton.style.backgroundColor = '#1d9bf0'; // Twitter blue color
    retranslateButton.style.color = 'white';
    retranslateButton.style.border = 'none';
    retranslateButton.style.borderRadius = '5px';
    retranslateButton.style.cursor = 'pointer';
    retranslateButton.style.fontSize = '13px';
    retranslateButton.style.fontFamily = 'Vazirmatn, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    
    // Only enable retranslate button if we have the original text
    if (originalText) {
        retranslateButton.addEventListener('click', async () => {
            retranslateButton.disabled = true;
            retranslateButton.textContent = 'Translating...';
            
            try {
                // Clear translation cache for this text to get a fresh translation
                translationCache.delete(originalText);
                const newTranslation = await translateText(originalText);
                if (newTranslation) {
                    // Replace newline characters with <br> tags for updated translation
                    const formattedNewTranslation = newTranslation.replace(/\n/g, '<br>');
                    translationText.innerHTML = formattedNewTranslation;
                }
            } catch (error) {
                console.error('Translation error:', error);
                alert('Translation error.');
            } finally {
                retranslateButton.disabled = false;
                retranslateButton.textContent = 'Re-translate';
            }
        });
    } else {
        retranslateButton.disabled = true;
        retranslateButton.style.opacity = '0.5';
        retranslateButton.title = 'Original text not available for retranslation';
    }
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.className = 'translation-close-btn';
    
    closeButton.addEventListener('click', () => {
        document.body.removeChild(translationBox);
    });
    
    // Add copy button
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy';
    copyButton.style.marginTop = '10px';
    copyButton.style.marginRight = '10px';
    copyButton.style.padding = '5px 10px';
    copyButton.style.backgroundColor = '#1d9bf0'; // Twitter blue color
    copyButton.style.color = 'white';
    copyButton.style.border = 'none';
    copyButton.style.borderRadius = '5px';
    copyButton.style.cursor = 'pointer';
    copyButton.style.fontSize = '13px';
    copyButton.style.fontFamily = 'Vazirmatn, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    
    copyButton.addEventListener('click', () => {
        // Get all text content from the translation box except for buttons
        let textToCopy = '';
        const walker = document.createTreeWalker(translationBox, NodeFilter.SHOW_TEXT, {
            acceptNode: function(node) {
                // Exclude text nodes that are children of buttons
                return (node.parentNode && node.parentNode.tagName === 'BUTTON') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
            }
        });
        let node;
        while (node = walker.nextNode()) {
            textToCopy += node.textContent + '\n';
        }
        textToCopy = textToCopy.trim();
        
        // Use the Clipboard API to copy the text
        navigator.clipboard.writeText(textToCopy).then(() => {
            // Provide visual feedback that text was copied
            const originalText = copyButton.textContent;
            copyButton.textContent = 'Copied!';
            copyButton.style.backgroundColor = '#28a745'; // Green color for success
            
            // Reset button after a short delay
            setTimeout(() => {
                copyButton.textContent = originalText;
                copyButton.style.backgroundColor = '#1d9bf0';
            }, 2000);
        }).catch(err => {
            console.error('Copy error:', err);
            alert('Copy error.');
        });
    });
    
    // Create a container for the buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-start';
    buttonContainer.style.width = '100%';
    
    // Add buttons to the container
    buttonContainer.appendChild(retranslateButton);
    buttonContainer.appendChild(copyButton);
    
    // Add elements to the box
    translationBox.appendChild(closeButton);
    translationBox.appendChild(translationText);
    translationBox.appendChild(buttonContainer);
    
    // Add to the page if it's not already there
    if (!document.body.contains(translationBox)) {
        document.body.appendChild(translationBox);
    }
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Get box dimensions
    const boxRect = translationBox.getBoundingClientRect();
    
    // Use last position if available, otherwise center the box
    let top, left;
    
    if (lastTranslationBoxPosition.positionSet) {
        // Use the last position
        top = lastTranslationBoxPosition.top;
        left = lastTranslationBoxPosition.left;
    } else {
        // Center the box in the viewport
        top = (viewportHeight - boxRect.height) / 2;
        left = (viewportWidth - boxRect.width) / 2;
    }
    
    // Make sure it doesn't go off-screen
    if (left < 10) left = 10;
    if (top < 10) top = 10;
    if (left + boxRect.width > viewportWidth - 10) {
        left = viewportWidth - boxRect.width - 10;
    }
    if (top + boxRect.height > viewportHeight - 10) {
        top = viewportHeight - boxRect.height - 10;
    }
    
    // Apply the position
    translationBox.style.top = `${top}px`;
    translationBox.style.left = `${left}px`;
    
    // Make the box draggable and update position when dragged
    makeDraggable(translationBox, true);
    
    // Add event listener to close on Escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape' && document.body.contains(translationBox)) {
            document.body.removeChild(translationBox);
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Add event listener to close when clicking outside
    const clickOutsideHandler = (e) => {
        if (!translationBox.contains(e.target)) {
            if (document.body.contains(translationBox)) {
                document.body.removeChild(translationBox);
                document.removeEventListener('click', clickOutsideHandler);
            }
        }
    };
    // Delay adding the click handler to prevent immediate closing
    setTimeout(() => {
        document.addEventListener('click', clickOutsideHandler);
    }, 100);
}

// Helper function to create or get existing translation box
function getTranslationBoxElement() {
    injectGlobalStyles(); // Ensure styles are present

    let translationBox = document.getElementById('translation-box');
    if (!translationBox) {
        translationBox = document.createElement('div');
        translationBox.id = 'translation-box';
        document.body.appendChild(translationBox);
        // Add event listeners only when the box is first created
        addTranslationBoxEventListeners(translationBox);
        makeDraggable(translationBox, true); // Enable dragging and save position
    }
    // Clear previous content when reusing
    translationBox.innerHTML = '';
    return translationBox;
}

// Helper function to add event listeners
function addTranslationBoxEventListeners(translationBox) {
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.getElementById('translation-box')) {
            document.body.removeChild(translationBox);
        }
    });
    
    // Close button click
    const closeButton = translationBox.querySelector('button');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            document.body.removeChild(translationBox);
        });
    }
    
    // Click outside to close
    document.addEventListener('click', (e) => {
        if (translationBox && !translationBox.contains(e.target) && 
            e.target.id !== 'translate-selected-text') {
            if (document.body.contains(translationBox)) {
                document.body.removeChild(translationBox);
            }
        }
    });
    
    // Make box draggable
    makeDraggable(translationBox);
}

// Helper function to adjust translation box position
function adjustTranslationBoxPosition(translationBox) {
    const box = translationBox.getBoundingClientRect();
    const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
    };
    
    let left = (viewport.width - box.width) / 2;
    let top = (viewport.height - box.height) / 2;
    
    if (left < 20) left = 20;
    if (top < 20) top = 20;
    if (left + box.width > viewport.width - 20) {
        left = viewport.width - box.width - 20;
    }
    if (top + box.height > viewport.height - 20) {
        top = viewport.height - box.height - 20;
    }
    
    Object.assign(translationBox.style, {
        left: `${left}px`,
        top: `${top}px`
    });
}

// Helper function to make element draggable
function makeDraggable(element, savePosition = false) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    element.style.cursor = 'move';
    
    element.onmousedown = dragMouseDown;
    
    function dragMouseDown(e) {
        if (e.target.tagName.toLowerCase() === 'button') return;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }
    
    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        const newTop = element.offsetTop - pos2;
        const newLeft = element.offsetLeft - pos1;
        
        if (newTop >= 0 && newTop <= window.innerHeight - element.offsetHeight) {
            element.style.top = newTop + "px";
        }
        if (newLeft >= 0 && newLeft <= window.innerWidth - element.offsetWidth) {
            element.style.left = newLeft + "px";
        }
    }
    
    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        
        // Save the position for future boxes if requested
        if (savePosition) {
            lastTranslationBoxPosition.top = parseInt(element.style.top);
            lastTranslationBoxPosition.left = parseInt(element.style.left);
            lastTranslationBoxPosition.positionSet = true;
        }
    }
}

// Centralized Styles and Box Management
let stylesInjected = false;
const XT_STYLE_ID = 'xtranslator-global-styles';
const XT_FONT_STYLE_ID = 'xtranslator-vazirmatn-font-style';

// Function to inject all necessary CSS styles once
function injectGlobalStyles() {
    if (stylesInjected || document.getElementById(XT_STYLE_ID)) {
        stylesInjected = true;
        return;
    }

    // Add @font-face declaration for Vazirmatn font if not already added
    if (!document.getElementById(XT_FONT_STYLE_ID)) {
        const fontStyle = document.createElement('style');
        fontStyle.id = XT_FONT_STYLE_ID;
        try {
            // Try fetching the font URL via chrome.runtime.getURL
            fontStyle.textContent = `
                /* ========== Vazirmatn ========== */
                @font-face {
                    font-family: "Vazirmatn";
                    src: url("${chrome.runtime.getURL('fonts/Vazirmatn[wght].ttf')}") format("truetype");
                    font-weight: 100 900;
                    font-style: normal;
                    font-display: swap;
                    unicode-range: U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFF;
                }
            `;
            document.head.appendChild(fontStyle);
        } catch (error) {
            console.warn('XTranslator: Could not get font URL via chrome.runtime.getURL. Font may not load.', error);
            // Fallback or alternative handling if needed
        }
    }

    const style = document.createElement('style');
    style.id = XT_STYLE_ID;
    style.textContent = `
        #translation-box {
            position: fixed !important;
            z-index: 999999 !important;
            border-radius: 12px !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.22) !important;
            padding: 16px !important;
            max-height: 80vh !important;
            width: 350px !important; /* Default width, adjust as needed */
            max-width: 90vw !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            direction: rtl !important;
            font-family: "Vazirmatn", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            font-size: 15px !important; /* Base font size */
            line-height: 1.7 !important;
            text-align: right !important;
            animation: translationBoxFadeIn 0.2s ease-out !important;
            box-sizing: border-box !important; /* Include padding/border in width/height */
            background-color: #23272f !important;
            color: #e7e9ea !important;
            border: 1px solid #38444d !important;
        }



        /* Scrollbar */
        #translation-box::-webkit-scrollbar {
            width: 8px !important;
        }
        #translation-box::-webkit-scrollbar-thumb {
             border-radius: 4px !important;
        }

        /* Content Area */
        #translation-box .translation-content {
            font-size: 16px !important; /* Slightly larger for readability */
            line-height: 1.8 !important;
            margin-bottom: 12px !important; /* Space before buttons */
            white-space: pre-wrap !important;
            word-wrap: break-word !important;
            font-family: "Vazirmatn", Tahoma, Arial, sans-serif !important; /* Ensure font */
            direction: rtl !important;
            text-align: right !important;
        }

        /* Close Button */
        #translation-box .translation-close-btn {
            position: absolute !important;
            top: 0px !important;
            left: 0px !important;
            background: none !important;
            border: none !important;
            font-size: 24px !important; /* Larger target */
            cursor: pointer !important;
            padding: 0 !important;
            margin: 0 !important;
            line-height: 1 !important;
            width: 28px !important; /* Slightly larger tap target */
            height: 28px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            border-radius: 50% !important; /* Make it round on hover bg */
            transition: background-color 0.2s ease;
            color: #e7e9ea !important;
        }
        #translation-box .translation-close-btn:hover {
            color: #fff !important;
            background-color: rgba(231, 233, 234, 0.08) !important;
        }

        /* Button Container */
        #translation-box .translation-button-container {
            display: flex !important;
            justify-content: flex-start !important; /* Align buttons to the start (right in RTL) */
            gap: 8px !important; /* Space between buttons */
            margin-top: 8px !important;
        }

        /* General Button Styles */
        #translation-box .translation-button {
            padding: 6px 12px !important;
            border: none !important;
            border-radius: 15px !important; /* Pill shape like Twitter */
            cursor: pointer !important;
            font-size: 13px !important;
            font-weight: bold !important;
            font-family: "Vazirmatn", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            transition: background-color 0.2s ease;
        }
         #translation-box .translation-button:disabled {
             cursor: default !important;
        }


        /* Fade-in Animation */
        @keyframes translationBoxFadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
    stylesInjected = true;
}

// Function to translate text using Gemini API
const translationCache = new Map();

async function translateText(text) {
    if (translationCache.has(text)) {
        return translationCache.get(text);
    }

    try {
        // Get API key, prompt, and target language from storage
        const { apiKey, translationPrompt, targetLanguage } = await chrome.storage.sync.get(['apiKey', 'translationPrompt', 'targetLanguage']);
        
        if (!apiKey) {
            console.error('API key not found. Please set it in the extension settings.');
            return null;
        }

        if (!translationPrompt) {
            console.error('Translation prompt not found in storage');
            return null;
        }

        let prompt = translationPrompt;
        prompt = prompt.replace('<TEXT>', text);
        prompt = prompt.replace(/<LANGUAGE>/g, targetLanguage || 'Persian');

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
        const payload = {
            contents: [{
                parts: [{ text: prompt }]
            }]
        };

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
        console.warn('Error translating:', error.message);
        return null;
    }
}

async function performTranslation(tweet, textContent, lang, button) {
    // Store original text to restore it later
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Translating...';

    try {
        const translation = await translateText(textContent);
        if (translation) {
            // Use our unified displayTranslation function
            displayTranslation(translation, textContent);
        } else {
            alert('Translation failed.');
        }
    } catch (error) {
        console.error('Translation error:', error);
        alert('Translation error.');
    } finally {
        button.disabled = false;
        button.textContent = originalText; // Restore the original button text
    }
}

// Function to check if we're on Twitter/X
function isTwitterSite() {
    return window.location.hostname === 'twitter.com' || window.location.hostname === 'x.com';
}

// Function to add translation buttons below non-Persian tweets
async function addTranslateButtons() {
    // Only add tweet translation buttons on Twitter/X
    if (!isTwitterSite()) {
        return;
    }

    // Get the user-selected language to exclude
    const { excludeTweetLang } = await chrome.storage.sync.get(['excludeTweetLang']);
    
    const tweets = Array.from(document.querySelectorAll('article')).map(article => {
        // Build selector: if excludeTweetLang, exclude that lang; otherwise, select all
        let selector = 'div[dir="auto"]';
        if (excludeTweetLang) {
            selector += `:not([lang="${excludeTweetLang}"])`;
        }
        const candidates = Array.from(article.querySelectorAll(selector));
        // Exclude divs that are inside a quoted tweet (which are nested articles)
        const mainCandidates = candidates.filter(div => !div.closest('article article'));
        // Only pick the first one, which is the main tweet text
        return mainCandidates[0];
    }).filter(Boolean);

    for (const tweet of tweets) {
        // Find the tweet action bar
        let tweetActionsEl = tweet.closest('article')?.querySelector('[role="group"]');
        if (!tweetActionsEl) continue;

        // Prevent duplicate: check if a translate button already exists in this action bar
        if (tweetActionsEl.querySelector('.translate-button')) continue;

        // Try to find the timestamp element to position our button near it
        let timestampEl = tweet.closest('article')?.querySelector('time');
        
        // Create the button with a more button-like appearance
        const button = document.createElement('button');
        button.className = 'translate-button';
        button.style.display = 'inline-flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.backgroundColor = 'transparent';
        button.style.color = '#1d9bf0'; // Twitter blue
        button.style.border = '1px solid #1d9bf0'; // Add border back for button-like appearance
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';
        button.style.textAlign = 'center';
        button.style.lineHeight = '1';
        button.style.transition = 'all 0.2s';
        button.style.margin = '0 4px 0 0';
        button.style.padding = '1px 4px';
        button.style.height = '18px';
        button.style.fontSize = '11px';
        button.style.fontWeight = 'bold';

        // Responsive: icon-only and compact on small screens
        function setButtonStyle() {
            if (window.innerWidth < 600) {
                // Icon only: Use bold T for Translate
                button.innerHTML = '<span style="font-weight:bold;font-size:11px;line-height:1;color:#1d9bf0;">T</span>';
                button.title = 'Translate';
                button.style.padding = '1px 4px';
                button.style.margin = '0 4px 0 0';
                button.style.fontSize = '0px'; // Hide text
                button.style.width = '16px';
                button.style.height = '16px';
                button.style.border = '1px solid #1d9bf0';
                button.style.borderRadius = '4px';
                button.style.display = 'inline-flex';
                button.style.alignItems = 'center';
                button.style.justifyContent = 'center';
            } else {
                button.innerHTML = 'Translate';
                button.title = 'Translate';
                button.style.padding = '1px 4px';
                button.style.margin = '0 4px 0 0';
                button.style.fontSize = '11px';
                button.style.fontWeight = 'bold';
                button.style.height = '18px';
                button.style.width = 'auto';
                button.style.border = '1px solid #1d9bf0';
                button.style.borderRadius = '4px';
                button.style.display = 'inline-flex';
                button.style.alignItems = 'center';
                button.style.justifyContent = 'center';
            }
        }
        setButtonStyle();
        window.addEventListener('resize', setButtonStyle);
        // Add hover effect
        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = 'rgba(29, 155, 240, 0.1)';
        });
        
        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = 'transparent';
        });
        
        // Add a data attribute to the tweet
        tweet.dataset.tweetIndex = tweet.dataset.tweetIndex || Math.random().toString(36).substring(2, 9);

        button.addEventListener('click', async (event) => {
            event.stopPropagation();
            
            // Find the specific tweet text element to avoid capturing UI elements
            const tweetTextEl = tweet.closest('article').querySelector('[data-testid="tweetText"]');
            let textContent = '';
            
            if (tweetTextEl) {
                // Use the dedicated tweet text element if found
                textContent = tweetTextEl.textContent.trim();
            } else {
                // Fallback to the tweet element but try to avoid capturing UI text
                textContent = tweet.textContent.trim();
            }
            
            const lang = tweet.getAttribute('lang');
            await performTranslation(tweet, textContent, lang, button);
            // Restore button content after translation completes
            setButtonStyle();
        });
        
        // Add event listeners to prevent event propagation
        button.addEventListener('mousedown', (e) => e.stopPropagation());
        button.addEventListener('mouseup', (e) => e.stopPropagation());
        button.addEventListener('touchstart', (e) => e.stopPropagation());
        button.addEventListener('touchend', (e) => e.stopPropagation());
        
        // Create a container for the button that prevents event bubbling
        const container = document.createElement('div');
        container.style.display = 'inline-flex';
        container.style.alignItems = 'center'; // Center vertically
        container.style.height = '100%'; // Match height of parent
        container.style.justifyContent = 'center'; // Center horizontally
        container.appendChild(button);
        
        // Stop propagation on the container too
        container.addEventListener('click', (e) => e.stopPropagation());
        container.addEventListener('mousedown', (e) => e.stopPropagation());
        container.addEventListener('mouseup', (e) => e.stopPropagation());
        
        // Insert the button in a suitable location
        if (tweetActionsEl) {
            // Create a wrapper div that matches Twitter's action button containers
            const actionWrapper = document.createElement('div');
            actionWrapper.className = 'translate-action-wrapper';
            actionWrapper.style.display = 'flex';
            actionWrapper.style.alignItems = 'center';
            actionWrapper.style.height = '100%';
            actionWrapper.style.marginRight = '4px';
            
            // Add the container to the wrapper
            actionWrapper.appendChild(container);
            
            // Place with tweet actions to avoid link conflicts
            tweetActionsEl.insertBefore(actionWrapper, tweetActionsEl.firstChild);
        } else {
            // Fallback: append to the tweet in an unobtrusive way
            const fallbackContainer = document.createElement('div');
            fallbackContainer.style.display = 'flex';
            fallbackContainer.style.alignItems = 'center';
            fallbackContainer.style.justifyContent = 'flex-start';
            fallbackContainer.style.marginTop = '4px';
            fallbackContainer.appendChild(button);
            
            // Find a good place to insert it
            const contentContainer = tweet.closest('article')?.querySelector('[data-testid="tweetText"]') || tweet;
            contentContainer.parentNode.insertBefore(fallbackContainer, contentContainer.nextSibling);
        }
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

// Function to check if the current page is a PDF
function isPdfPage() {
    return window.location.href.toLowerCase().endsWith('.pdf') || 
           document.contentType === 'application/pdf' ||
           document.querySelector('embed[type="application/pdf"]') !== null ||
           document.querySelector('object[type="application/pdf"]') !== null ||
           document.querySelector('iframe[src*=".pdf"]') !== null;
}

// Function to add PDF translation button
function addPdfTranslationButton() {
    // Remove existing button if any
    const existingButton = document.getElementById('pdf-translate-button');
    if (existingButton) existingButton.remove();
    
    // Create the button
    const translateButton = document.createElement('button');
    translateButton.id = 'pdf-translate-button';
    translateButton.textContent = 'Translate PDF';
    translateButton.style.position = 'fixed';
    translateButton.style.top = '20px';
    translateButton.style.right = '180px';
    translateButton.style.zIndex = '999999';
    translateButton.style.padding = '8px 16px';
    translateButton.style.backgroundColor = '#01afbe';
    translateButton.style.color = 'white';
    translateButton.style.border = 'none';
    translateButton.style.borderRadius = '4px';
    translateButton.style.cursor = 'pointer';
    translateButton.style.fontFamily = 'Tahoma, Arial, sans-serif';
    translateButton.style.fontSize = '14px';
    translateButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    
    // Add hover effect
    translateButton.addEventListener('mouseover', () => {
        translateButton.style.backgroundColor = '#13cbe0';
    });
    
    translateButton.addEventListener('mouseout', () => {
        translateButton.style.backgroundColor = '#01afbe';
    });
    
    // Add click event - show menu to choose mode
    // Helper to remove menu and its outside click listener
    function removeMenuAndListener() {
        const existingMenu = document.getElementById('pdf-translate-menu');
        if (existingMenu) existingMenu.remove();
        document.removeEventListener('pointerdown', outsideClickListener, true);
    }

    function outsideClickListener(event) {
        const menu = document.getElementById('pdf-translate-menu');
        // If no menu or click inside menu or on button, do nothing
        if (!menu || menu.contains(event.target) || event.target === translateButton) return;
        removeMenuAndListener();
    }

    translateButton.addEventListener('click', function(e) {
        e.stopPropagation();
        const existingMenu = document.getElementById('pdf-translate-menu');
        if (existingMenu) {
            removeMenuAndListener();
            return;
        }
        // Otherwise, open the menu
        const menu = document.createElement('div');
        menu.id = 'pdf-translate-menu';
        menu.style.position = 'fixed';
        menu.style.top = (translateButton.offsetTop + translateButton.offsetHeight + 8) + 'px';
        menu.style.right = (parseInt(translateButton.style.right, 10)) + 'px';
        menu.style.background = '#fff';
        menu.style.border = '1px solid #ccc';
        menu.style.borderRadius = '6px';
        menu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        // Prevent clicks inside menu from closing it
        menu.addEventListener('pointerdown', function(ev) { ev.stopPropagation(); }, true);
        // Add menu to DOM
        document.body.appendChild(menu);
        // Delay outside click activation to avoid immediate close
        setTimeout(() => {
            document.addEventListener('pointerdown', outsideClickListener, true);
        }, 0);
        // If menu is removed by any means, clean up listener
        const observer = new MutationObserver(() => {
            if (!document.body.contains(menu)) {
                document.removeEventListener('pointerdown', outsideClickListener, true);
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true });

        menu.style.right = (parseInt(translateButton.style.right, 10)) + 'px';
        menu.style.background = '#fff';
        menu.style.border = '1px solid #ccc';
        menu.style.borderRadius = '6px';
        menu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        menu.style.zIndex = '1000000';
        menu.style.minWidth = '170px';
        menu.style.fontFamily = 'Tahoma, Arial, sans-serif';
        menu.style.padding = '0.5em 0';

        // Option 1: Translate visible page
        const pageOption = document.createElement('div');
        pageOption.textContent = 'Translate visible page';
        pageOption.style.padding = '8px 16px';
        pageOption.style.cursor = 'pointer';
        pageOption.addEventListener('mouseover', () => pageOption.style.background = '#f0f0f0');
        pageOption.addEventListener('mouseout', () => pageOption.style.background = '');
        pageOption.onclick = function() {
            menu.remove();
            captureAndTranslatePdf();
        };
        menu.appendChild(pageOption);

        // Option 2: Area selection
        const areaOption = document.createElement('div');
        areaOption.textContent = 'Select area to translate';
        areaOption.style.padding = '8px 16px';
        areaOption.style.cursor = 'pointer';
        areaOption.addEventListener('mouseover', () => areaOption.style.background = '#f0f0f0');
        areaOption.addEventListener('mouseout', () => areaOption.style.background = '');
        areaOption.onclick = function() {
            menu.remove();
            startAreaSelection();
        };
        menu.appendChild(areaOption);

        // Remove menu when clicking outside
        setTimeout(() => {
            document.addEventListener('mousedown', function handler(ev) {
                if (!menu.contains(ev.target) && ev.target !== translateButton) {
                    menu.remove();
                    document.removeEventListener('mousedown', handler);
                }
            });
        }, 0);

        document.body.appendChild(menu);
    });
    
    // Add to the page
    document.body.appendChild(translateButton);
}

// Check for PDF and add translation button
function checkForPdfAndAddButton() {
    if (isPdfPage()) {
        console.log('PDF detected, adding translation button');
        addPdfTranslationButton();
    }
}

// Initial check when the script loads
checkForPdfAndAddButton();

// Check when the page loads
document.addEventListener('DOMContentLoaded', checkForPdfAndAddButton);

// Re-check periodically (some PDFs might load dynamically)
setInterval(checkForPdfAndAddButton, 2000);

// Re-check when the URL changes (for SPA)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(checkForPdfAndAddButton, 1000);
    }
}).observe(document, { subtree: true, childList: true });

// Function to capture and translate PDF (visible page)
async function captureAndTranslatePdf() {
    console.log('Starting PDF translation process');
    showLoadingIndicator();
    
    try {
        chrome.runtime.sendMessage({
            action: 'captureVisibleTab'
        }, async function(response) {
            if (response && response.imageDataUrl) {
                console.log('Screenshot captured, starting translation');
                const translation = await translateImage(response.imageDataUrl);
                hideLoadingIndicator();
                if (translation) {
                    displayTranslation(translation);
                } else {
                    alert('Translation failed.');
                }
            } else {
                hideLoadingIndicator();
                console.error('Failed to capture screenshot:', response?.error);
                alert('Failed to capture image.');
            }
        });
    } catch (error) {
        hideLoadingIndicator();
        console.error('Error capturing full page:', error);
        alert('Error capturing page: ' + error.message);
    }
}

// Function to start area selection
function startAreaSelection() {
    console.log('Starting area selection');
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'selection-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    overlay.style.zIndex = '999998';
    overlay.style.cursor = 'crosshair';
    
    // Create selection box
    const selectionBox = document.createElement('div');
    selectionBox.id = 'selection-box';
    selectionBox.style.position = 'fixed';
    selectionBox.style.border = '2px dashed #fff';
    selectionBox.style.backgroundColor = 'rgba(117, 158, 0, 0.2)';
    selectionBox.style.display = 'none';
    selectionBox.style.zIndex = '999999';
    
    // Create instruction text
    const instruction = document.createElement('div');
    instruction.textContent = 'Select the area you want to translate. To cancel, press the ESC key.';
    instruction.style.position = 'fixed';
    instruction.style.top = '10px';
    instruction.style.left = '50%';
    instruction.style.transform = 'translateX(-50%)';
    instruction.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    instruction.style.color = 'white';
    instruction.style.padding = '10px 15px';
    instruction.style.borderRadius = '5px';
    instruction.style.zIndex = '1000000';
    instruction.style.fontFamily = 'Tahoma, Arial, sans-serif';
    
    // Add elements to page
    document.body.appendChild(overlay);
    document.body.appendChild(selectionBox);
    document.body.appendChild(instruction);
    
    let isSelecting = false;
    let startX = 0;
    let startY = 0;
    
    function cleanup() {
        // Remove event listeners
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('keydown', handleKeyDown);
        
        // Remove elements
        overlay.remove();
        selectionBox.remove();
        instruction.remove();
    }
    
    function handleKeyDown(e) {
        if (e.key === 'Escape') {
            cleanup();
        }
    }
    
    function handleMouseDown(e) {
        e.preventDefault();
        e.stopPropagation();
        
        isSelecting = true;
        startX = e.clientX;
        startY = e.clientY;
        
        selectionBox.style.left = startX + 'px';
        selectionBox.style.top = startY + 'px';
        selectionBox.style.width = '0';
        selectionBox.style.height = '0';
        selectionBox.style.display = 'block';
    }
    
    function handleMouseMove(e) {
        if (!isSelecting) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const currentX = e.clientX;
        const currentY = e.clientY;
        
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        
        const left = Math.min(currentX, startX);
        const top = Math.min(currentY, startY);
        
        selectionBox.style.left = left + 'px';
        selectionBox.style.top = top + 'px';
        selectionBox.style.width = width + 'px';
        selectionBox.style.height = height + 'px';
    }
    
    function handleMouseUp(e) {
        if (!isSelecting) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        isSelecting = false;
        
        const width = parseInt(selectionBox.style.width);
        const height = parseInt(selectionBox.style.height);
        
        if (width >= 10 && height >= 10) {
            const rect = {
                left: parseInt(selectionBox.style.left),
                top: parseInt(selectionBox.style.top),
                width: width,
                height: height
            };
            
            cleanup();
            captureSelectedArea(rect);
        } else {
            cleanup();
        }
    }
    
    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    overlay.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Prevent text selection
    overlay.addEventListener('selectstart', e => e.preventDefault());
}

// Function to capture selected area
async function captureSelectedArea(rect) {
    console.log('Capturing selected area:', rect);
    showLoadingIndicator();
    
    try {
        chrome.runtime.sendMessage({
            action: 'captureVisibleTab',
            area: rect
        }, async function(response) {
            if (chrome.runtime.lastError) {
                console.error('Chrome runtime error:', chrome.runtime.lastError);
                hideLoadingIndicator();
                alert('Error capturing image: ' + chrome.runtime.lastError.message);
                return;
            }
            
            if (response && response.imageDataUrl) {
                console.log('Area captured, starting translation');
                const translation = await translateImage(response.imageDataUrl);
                hideLoadingIndicator();
                if (translation) {
                    displayTranslation(translation);
                } else {
                    alert('Translation failed.');
                }
            } else {
                hideLoadingIndicator();
                console.error('Failed to capture area:', response?.error);
                alert('Failed to capture image.');
            }
        });
    } catch (error) {
        hideLoadingIndicator();
        console.error('Error capturing selected area:', error);
        alert('Error capturing area: ' + error.message);
    }
}

// Function to translate image using Gemini API
async function translateImage(imageDataUrl) {
    console.log('Starting image translation');
    const { apiKey, translationPrompt, targetLanguage } = await chrome.storage.sync.get(['apiKey', 'translationPrompt', 'targetLanguage']);
    const selectedLanguage = targetLanguage || 'Persian';

    if (!apiKey) {
        console.error('API key not found');
        alert('Please enter your API Key in the extension settings.');
        return null;
    }
    
    let prompt = translationPrompt || DEFAULT_IMAGE_TRANSLATION_PROMPT;
    prompt = prompt.replace(/<LANGUAGE>/g, targetLanguage);

    const base64Image = imageDataUrl.split(',')[1];
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    try {
        console.log('Sending request to Gemini API');
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: "image/png",
                                data: base64Image
                            }
                        }
                    ]
                }]
            })
        });

        if (response.status === 429) {
            console.log('Rate limit hit, retrying...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            return translateImage(imageDataUrl);
        }

        if (!response.ok) {
            throw new Error(`Translation failed: ${response.status}`);
        }

        const result = await response.json();
        console.log('Translation completed successfully');
        return result.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error) {
        console.error('Translation error:', error);
        return null;
    }
}

// Function to show loading indicator
function showLoadingIndicator() {
    const existingIndicator = document.getElementById('translation-loading');
    if (existingIndicator) existingIndicator.remove();
    
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'translation-loading';
    loadingIndicator.style.position = 'fixed';
    loadingIndicator.style.top = '50%';
    loadingIndicator.style.left = '50%';
    loadingIndicator.style.transform = 'translate(-50%, -50%)';
    loadingIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    loadingIndicator.style.color = 'white';
    loadingIndicator.style.padding = '20px';
    loadingIndicator.style.borderRadius = '10px';
    loadingIndicator.style.zIndex = '1000000';
    loadingIndicator.style.textAlign = 'center';
    loadingIndicator.style.fontFamily = 'Tahoma, Arial, sans-serif';
    
    const spinner = document.createElement('div');
    spinner.style.border = '4px solid rgba(255, 255, 255, 0.3)';
    spinner.style.borderTop = '4px solid #fff';
    spinner.style.borderRadius = '50%';
    spinner.style.width = '30px';
    spinner.style.height = '30px';
    spinner.style.animation = 'spin 1s linear infinite';
    spinner.style.margin = '0 auto 10px auto';
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    
    document.head.appendChild(style);
    
    const text = document.createElement('div');
    text.textContent = 'Translating...';
    
    loadingIndicator.appendChild(spinner);
    loadingIndicator.appendChild(text);
    document.body.appendChild(loadingIndicator);
}

// Function to hide loading indicator
function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('translation-loading');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}
