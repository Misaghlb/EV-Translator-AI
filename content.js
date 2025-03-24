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
                displayTranslation(translation);
        } else {
            alert('Translation failed.');
        }
    }
}

// Function to display translation in a new box
function displayTranslation(translation) {
    const translationBox = createOrUpdateTranslationBox();
    const translationContent = document.createElement('div');
    translationContent.className = 'translation-content';
    
    // Replace newline characters with <br> tags to preserve paragraph formatting
    const formattedTranslation = translation.replace(/\n/g, '<br>');
    translationContent.innerHTML = formattedTranslation;
    
    if (!document.getElementById('translation-box')) {
        translationBox.appendChild(createCloseButton());
        translationBox.appendChild(translationContent);
        document.body.appendChild(translationBox);
        addTranslationBoxEventListeners(translationBox);
        requestAnimationFrame(() => adjustTranslationBoxPosition(translationBox));
    } else {
        const existingContent = translationBox.querySelector('.translation-content');
        existingContent.replaceWith(translationContent);
        adjustTranslationBoxPosition(translationBox);
    }
}

// Helper function to create or get existing translation box
function createOrUpdateTranslationBox() {
    let translationBox = document.getElementById('translation-box');
    
    if (!translationBox) {
        translationBox = document.createElement('div');
        translationBox.id = 'translation-box';
        
        Object.assign(translationBox.style, {
            position: 'fixed',
            zIndex: '999999',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            padding: '16px',
            maxHeight: '80vh',
            width: '700px',
            maxWidth: '90vw',
            overflowY: 'auto',
            overflowX: 'hidden',
            direction: 'rtl',
            fontFamily: 'Tahoma, Arial, sans-serif',
            fontSize: '18px',
            lineHeight: '1.8',
            color: '#333'
        });
        
        const style = document.createElement('style');
        style.textContent = `
            #translation-box::-webkit-scrollbar {
                width: 8px !important;
            }
            #translation-box::-webkit-scrollbar-thumb {
                background-color: #ccc !important;
                border-radius: 4px !important;
            }
            
            #translation-box .translation-content {
                font-family: Tahoma, Arial, sans-serif !important;
                line-height: 1.8 !important;
                color: #333 !important;
                font-size: 18px !important;
                text-align: right !important;
                direction: rtl !important;
                margin-top: 8px !important;
                white-space: pre-wrap !important;
                word-wrap: break-word !important;
            }
            
            #translation-box .translation-close-btn {
                position: absolute !important;
                top: 8px !important;
                left: 8px !important;
                background: none !important;
                border: none !important;
                font-size: 24px !important;
                color: #666 !important;
                cursor: pointer !important;
                padding: 4px 8px !important;
                border-radius: 4px !important;
            }
            
            #translation-box .translation-close-btn:hover {
                background-color: #f5f5f5 !important;
            }
            
            @keyframes translationBoxFadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            #translation-box {
                animation: translationBoxFadeIn 0.2s ease-out !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    return translationBox;
}

// Helper function to create close button
function createCloseButton() {
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.className = 'translation-close-btn';
    return closeButton;
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
function makeDraggable(element) {
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
    }
}

// تابع ترجمه با استفاده از API جمینی
const translationCache = new Map();

async function translateText(text) {
    if (translationCache.has(text)) {
        return translationCache.get(text);
    }

    try {
        // Get API key and prompt from storage with fallback
        let apiKey, translationPrompt;
        
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            const result = await chrome.storage.sync.get(['apiKey', 'translationPrompt']);
            apiKey = result.apiKey;
            translationPrompt = result.translationPrompt;
        }

        // Try localStorage as fallback for API key
        if (!apiKey && typeof localStorage !== 'undefined') {
            apiKey = localStorage.getItem('geminiApiKey');
        }

        if (!apiKey) {
            console.error('API key not found. Please set it in the extension settings.');
            return null;
        }

        // Default prompt if none is set
        const defaultPrompt = `You are a professional translator. Please translate the following text into fluent, natural Persian. Use proper Persian idioms and formal native structures where appropriate. Here's the text to translate:

<TEXT>

Translate the above text into Persian.`;

        const prompt = (translationPrompt || defaultPrompt).replace('<TEXT>', text);
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
        console.warn('مشکل در ترجمه:', error.message);
        return null;
    }
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
            // Replace newline characters with <br> tags to preserve paragraph formatting
            const formattedTranslation = translation.replace(/\n/g, '<br>');
            translationText.innerHTML = formattedTranslation;
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
                        // Replace newline characters with <br> tags for updated translation
                        const formattedNewTranslation = newTranslation.replace(/\n/g, '<br>');
                        translationText.innerHTML = formattedNewTranslation;
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
    translateButton.textContent = 'ترجمه PDF';
    translateButton.style.position = 'fixed';
    translateButton.style.top = '20px';
    translateButton.style.right = '180px';
    translateButton.style.zIndex = '999999';
    translateButton.style.padding = '8px 16px';
    translateButton.style.backgroundColor = '#749e00';
    translateButton.style.color = 'white';
    translateButton.style.border = 'none';
    translateButton.style.borderRadius = '4px';
    translateButton.style.cursor = 'pointer';
    translateButton.style.fontFamily = 'Tahoma, Arial, sans-serif';
    translateButton.style.fontSize = '14px';
    translateButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    
    // Add hover effect
    translateButton.addEventListener('mouseover', () => {
        translateButton.style.backgroundColor = '#8bbc00';
    });
    
    translateButton.addEventListener('mouseout', () => {
        translateButton.style.backgroundColor = '#749e00';
    });
    
    // Add click event
    translateButton.addEventListener('click', captureAndTranslatePdf);
    
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

// Function to capture and translate PDF
async function captureAndTranslatePdf() {
    console.log('Starting PDF translation process');
    showPdfCaptureOptions();
}

// Function to show PDF capture options
function showPdfCaptureOptions() {
    console.log('Showing PDF capture options');
    // Remove existing options if any
    const existingOptions = document.getElementById('pdf-capture-options');
    if (existingOptions) existingOptions.remove();
    
    // Create options container
    const optionsContainer = document.createElement('div');
    optionsContainer.id = 'pdf-capture-options';
    optionsContainer.style.position = 'fixed';
    optionsContainer.style.top = '70px';
    optionsContainer.style.right = '20px';
    optionsContainer.style.zIndex = '999999';
    optionsContainer.style.backgroundColor = 'white';
    optionsContainer.style.padding = '15px';
    optionsContainer.style.borderRadius = '8px';
    optionsContainer.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    optionsContainer.style.fontFamily = 'Tahoma, Arial, sans-serif';
    optionsContainer.style.direction = 'rtl';
    optionsContainer.style.textAlign = 'right';
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = 'انتخاب روش ترجمه';
    title.style.margin = '0 0 15px 0';
    title.style.fontSize = '16px';
    title.style.color = '#333';
    optionsContainer.appendChild(title);
    
    // Add options
    const fullPageOption = createOptionButton('ترجمه کل صفحه', captureFullPage);
    const selectionOption = createOptionButton('ترجمه ناحیه انتخابی', startAreaSelection);
    
    optionsContainer.appendChild(fullPageOption);
    optionsContainer.appendChild(selectionOption);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '✕';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '5px';
    closeButton.style.left = '5px';
    closeButton.style.backgroundColor = 'transparent';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '16px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.color = '#666';
    
    closeButton.addEventListener('click', () => {
        optionsContainer.remove();
    });
    
    optionsContainer.appendChild(closeButton);
    document.body.appendChild(optionsContainer);
}

// Function to create option button
function createOptionButton(text, clickHandler) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.display = 'block';
    button.style.width = '100%';
    button.style.padding = '10px';
    button.style.margin = '8px 0';
    button.style.backgroundColor = '#f5f8fa';
    button.style.border = '1px solid #ddd';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.textAlign = 'center';
    button.style.fontFamily = 'Tahoma, Arial, sans-serif';
    
    button.addEventListener('mouseover', () => {
        button.style.backgroundColor = '#e8f0fe';
    });
    
    button.addEventListener('mouseout', () => {
        button.style.backgroundColor = '#f5f8fa';
    });
    
    button.addEventListener('click', () => {
        document.getElementById('pdf-capture-options').remove();
        clickHandler();
    });
    
    return button;
}

// Function to capture full page
async function captureFullPage() {
    console.log('Capturing full page');
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
                    alert('ترجمه با مشکل مواجه شد.');
                }
            } else {
                hideLoadingIndicator();
                console.error('Failed to capture screenshot:', response?.error);
                alert('گرفتن تصویر با مشکل مواجه شد.');
            }
        });
    } catch (error) {
        hideLoadingIndicator();
        console.error('Error capturing full page:', error);
        alert('خطا در گرفتن تصویر صفحه: ' + error.message);
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
    instruction.textContent = 'ناحیه مورد نظر را انتخاب کنید. برای لغو، کلید ESC را فشار دهید.';
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
                alert('خطا در گرفتن تصویر: ' + chrome.runtime.lastError.message);
                return;
            }
            
            if (response && response.imageDataUrl) {
                console.log('Area captured, starting translation');
                const translation = await translateImage(response.imageDataUrl);
                hideLoadingIndicator();
                if (translation) {
                    displayTranslation(translation);
                } else {
                    alert('ترجمه با مشکل مواجه شد.');
                }
            } else {
                hideLoadingIndicator();
                console.error('Failed to capture area:', response?.error);
                alert('گرفتن تصویر با مشکل مواجه شد.');
            }
        });
    } catch (error) {
        hideLoadingIndicator();
        console.error('Error capturing selected area:', error);
        alert('خطا در گرفتن تصویر ناحیه انتخابی: ' + error.message);
    }
}

// Function to translate image using Gemini API
async function translateImage(imageDataUrl) {
    console.log('Starting image translation');
    const { apiKey, translationPrompt } = await chrome.storage.sync.get(['apiKey', 'translationPrompt']);

    if (!apiKey) {
        console.error('API key not found');
        alert('لطفاً API Key را در تنظیمات افزونه وارد کنید.');
        return null;
    }
    
    const defaultImagePrompt = `You are a professional translator tasked with converting text in this image into fluent, natural Persian. Extract all visible text from the image and translate it with precision, using Persian idioms, formal native structures, and a refined literary tone. Preserve the original text formatting as much as possible, including paragraph structure and any visible formatting. Provide only the translated content without any additional comments or explanations.`;
    
    const prompt = translationPrompt || defaultImagePrompt;
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
    text.textContent = 'در حال ترجمه...';
    
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
