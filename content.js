// Function to add context menu
let isMouseDown = false;
let selectionTimer = null;
const SELECTION_DELAY = 300; // ms
let lastSelectedText = ''; // Store the last selected text
let lastSelectedHtml = ''; // Store the last selected HTML

// Function to preserve text formatting when displaying translations
function preserveTextFormatting(text) {
  if (!text) return '';
  
  // First, escape HTML special characters to prevent XSS
  let formattedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  // Handle paragraphs (double newlines)
  formattedText = formattedText
    .replace(/\n\s*\n/g, '</p><p>');
  
  // Wrap the text in paragraph tags if it contains paragraphs
  if (formattedText.includes('</p><p>')) {
    formattedText = '<p>' + formattedText + '</p>';
  }
  
  // Handle single newlines (not in paragraphs)
  formattedText = formattedText.replace(/\n/g, '<br>');
  
  // Handle basic markdown-style formatting
  // Headers (# Header)
  formattedText = formattedText
    .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    .replace(/^#### (.*?)$/gm, '<h4>$1</h4>')
    .replace(/^##### (.*?)$/gm, '<h5>$1</h5>')
    .replace(/^###### (.*?)$/gm, '<h6>$1</h6>');
  
  // Bold: **text** or __text__
  formattedText = formattedText
    .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: bold !important;">$1</strong>')
    .replace(/__(.*?)__/g, '<strong style="font-weight: bold !important;">$1</strong>');
  
  // Italic: *text* or _text_
  formattedText = formattedText
    .replace(/\*(.*?)\*/g, '<em style="font-style: italic !important;">$1</em>')
    .replace(/_(.*?)_/g, '<em style="font-style: italic !important;">$1</em>');
    
  // Handle strikethrough: ~~text~~
  formattedText = formattedText
    .replace(/~~(.*?)~~/g, '<del style="text-decoration: line-through !important;">$1</del>');
    
  // Handle code blocks: ```code```
  formattedText = formattedText
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
  // Handle inline code: `code`
  formattedText = formattedText
    .replace(/`([^`]+)`/g, '<code>$1</code>');
    
  // Handle URLs: [text](url)
  formattedText = formattedText
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #0066cc !important; text-decoration: underline !important; font-weight: bold !important;">$1</a>');
    
  // Handle plain URLs: http://example.com
  formattedText = formattedText
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #0066cc !important; text-decoration: underline !important; font-weight: bold !important;">$1</a>');
    
  // Handle bullet lists (lines starting with * or - or •)
  let lines = formattedText.split('<br>');
  let inList = false;
  
  for (let i = 0; i < lines.length; i++) {
    // Check for bullet list items
    if (lines[i].match(/^\s*[\*\-\•]\s+/)) {
      // If this is the first item in a list, add opening <ul> tag
      if (!inList) {
        lines[i] = '<ul><li>' + lines[i].replace(/^\s*[\*\-\•]\s+/, '') + '</li>';
        inList = true;
      } else {
        lines[i] = '<li>' + lines[i].replace(/^\s*[\*\-\•]\s+/, '') + '</li>';
      }
    } else if (inList) {
      // If we were in a list but this line is not a list item, close the list
      lines[i-1] = lines[i-1] + '</ul>';
      inList = false;
    }
  }
  
  // Close any open list at the end of the text
  if (inList) {
    lines[lines.length-1] = lines[lines.length-1] + '</ul>';
  }
  
  // Rejoin the lines
  formattedText = lines.join('<br>');
  
  // Handle numbered lists (lines starting with 1., 2., etc.)
  lines = formattedText.split('<br>');
  inList = false;
  
  for (let i = 0; i < lines.length; i++) {
    // Check for numbered list items
    if (lines[i].match(/^\s*\d+\.\s+/)) {
      // If this is the first item in a list, add opening <ol> tag
      if (!inList) {
        lines[i] = '<ol><li>' + lines[i].replace(/^\s*\d+\.\s+/, '') + '</li>';
        inList = true;
      } else {
        lines[i] = '<li>' + lines[i].replace(/^\s*\d+\.\s+/, '') + '</li>';
      }
    } else if (inList) {
      // If we were in a list but this line is not a list item, close the list
      lines[i-1] = lines[i-1] + '</ol>';
      inList = false;
    }
  }
  
  // Close any open list at the end of the text
  if (inList) {
    lines[lines.length-1] = lines[lines.length-1] + '</ol>';
  }
  
  // Rejoin the lines
  formattedText = lines.join('<br>');
  
  // Add CSS for code blocks, inline code, and responsive text
  const codeStyle = `
    <style>
      code {
        background-color: rgba(0, 0, 0, 0.05);
        padding: 2px 4px;
        border-radius: 3px;
        font-family: monospace;
      }
      pre {
        background-color: rgba(0, 0, 0, 0.05);
        padding: 10px;
        border-radius: 5px;
        overflow-x: auto;
        max-width: 100%;
      }
      pre code {
        background-color: transparent;
        padding: 0;
      }
      p {
        margin: 0.5em 0;
        max-width: 100%;
      }
      h1, h2, h3, h4, h5, h6 {
        margin: 1em 0 0.5em 0;
        line-height: 1.2;
        font-weight: bold;
      }
      h1 {
        font-size: 2em;
      }
      h2 {
        font-size: 1.5em;
      }
      h3 {
        font-size: 1.3em;
      }
      h4 {
        font-size: 1.1em;
      }
      h5 {
        font-size: 1em;
      }
      h6 {
        font-size: 0.9em;
      }
      ul, ol {
        padding-right: 20px;
        margin: 0.5em 0;
      }
      li {
        margin-bottom: 0.3em;
      }
      img {
        max-width: 100%;
        height: auto;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 1em 0;
        overflow-x: auto;
        display: block;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: right;
      }
      th {
        background-color: rgba(0, 0, 0, 0.05);
      }
      blockquote {
        border-right: 3px solid #ccc;
        margin: 1em 0;
        padding: 0.5em 10px;
        background-color: rgba(0, 0, 0, 0.03);
      }
      a {
        color: #0066cc !important;
        text-decoration: underline !important;
        font-weight: bold !important;
      }
      a:hover {
        opacity: 0.8 !important;
      }
      a:visited {
        color: #551A8B !important;
      }
      b, strong {
        font-weight: bold !important;
      }
      i, em {
        font-style: italic !important;
      }
      u {
        text-decoration: underline !important;
      }
    </style>
  `;
  
  return codeStyle + formattedText;
}

// Function to get HTML content of selection
function getSelectionHtml() {
  let html = "";
  if (typeof window.getSelection != "undefined") {
    const sel = window.getSelection();
    if (sel.rangeCount) {
      const container = document.createElement("div");
      for (let i = 0; i < sel.rangeCount; ++i) {
        container.appendChild(sel.getRangeAt(i).cloneContents());
      }
      html = container.innerHTML;
    }
  } else if (typeof document.selection != "undefined") {
    if (document.selection.type == "Text") {
      html = document.selection.createRange().htmlText;
    }
  }
  return html;
}

// Function to safely process HTML content for translation
function processHtmlForTranslation(html) {
  if (!html) return '';
  
  // Create a temporary div to parse the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Process the HTML to make it safe for translation
  // Remove script tags
  const scripts = tempDiv.querySelectorAll('script');
  scripts.forEach(script => script.remove());
  
  // Remove style tags
  const styles = tempDiv.querySelectorAll('style');
  styles.forEach(style => style.remove());
  
  // Remove event handlers from all elements but preserve other attributes
  const allElements = tempDiv.querySelectorAll('*');
  allElements.forEach(el => {
    const attributes = el.attributes;
    for (let i = attributes.length - 1; i >= 0; i--) {
      const attrName = attributes[i].name;
      // Remove only event handlers and javascript: URLs
      if (attrName.startsWith('on') || (attrName === 'href' && attributes[i].value.startsWith('javascript:'))) {
        el.removeAttribute(attrName);
      }
    }
    
    // Preserve style attributes and classes as they contain formatting information
    if (!el.hasAttribute('style') && el.style && el.style.cssText) {
      el.setAttribute('style', el.style.cssText);
    }
  });
  
  // Preserve computed styles for elements that might not have inline styles
  preserveComputedStyles(tempDiv);
  
  return tempDiv.innerHTML;
}

// Function to preserve computed styles for elements
function preserveComputedStyles(container) {
  const elementsToCheck = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b', 'strong', 'i', 'em', 'u', 'mark', 'small', 'del', 'ins', 'sub', 'sup'];
  
  elementsToCheck.forEach(selector => {
    const elements = container.querySelectorAll(selector);
    elements.forEach(el => {
      // If the element doesn't have a style attribute, add one with the tag name as a class
      if (!el.hasAttribute('style')) {
        el.setAttribute('data-original-tag', el.tagName.toLowerCase());
      }
    });
  });
}

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
            // Get the HTML content of the selection
            const selectedHtml = getSelectionHtml();
            
            // Process the HTML to make it safe for translation
            const processedHtml = processHtmlForTranslation(selectedHtml);
            
            // Store both plain text and HTML for later use
            lastSelectedText = selectedText;
            lastSelectedHtml = processedHtml;
            
            // Show the translation button
            showTranslationButton(event, selectedText, processedHtml);
        }
    }, SELECTION_DELAY);
});

// Function to enhance selection if it appears to be from a triple-click
function enhanceSelectionIfNeeded(selection) {
    // Disabled to maintain default browser triple-click behavior
    return;
}

// Function to show the translation button
function showTranslationButton(event, selectedText, selectedHtml) {
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
        performSelectionTranslation(selectedText, selectedHtml);
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
async function performSelectionTranslation(selectedText, selectedHtml) {
    if (selectedText) {
        // Use the HTML content for translation if available, otherwise use plain text
        const textToTranslate = selectedHtml || selectedText;
        let translation = await translateText(textToTranslate);
        if (translation) {
            // If we translated HTML, we need to handle it differently
            if (selectedHtml) {
                displayHtmlTranslation(translation);
            } else {
                displayTranslation(translation);
            }
        } else {
            alert('Translation failed.');
        }
    }
}

// Function to adjust translation box position and size based on viewport
function adjustTranslationBoxForViewport(translationBox) {
    const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    
    // Adjust width based on screen size
    if (viewportWidth <= 768) { // Mobile devices
        translationBox.style.width = '90%';
        translationBox.style.minWidth = 'auto';
        translationBox.style.maxWidth = '90%';
        translationBox.style.left = '50%';
        translationBox.style.transform = 'translateX(-50%)';
    } else { // Larger screens
        translationBox.style.minWidth = '400px';
        translationBox.style.maxWidth = '80%';
        translationBox.style.width = 'auto';
        translationBox.style.left = '50%';
        translationBox.style.transform = 'translateX(-50%)';
    }
    
    // Adjust height based on content and viewport
    const boxHeight = translationBox.offsetHeight;
    if (boxHeight > viewportHeight * 0.8) {
        translationBox.style.height = (viewportHeight * 0.8) + 'px';
        translationBox.style.top = '10%';
    } else {
        translationBox.style.top = Math.max(5, Math.floor((viewportHeight - boxHeight) / 2) * 0.8) + 'px';
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
        
        // Initial positioning - will be adjusted by adjustTranslationBoxForViewport
        translationBox.style.top = '10%';
        translationBox.style.left = '50%';
        translationBox.style.transform = 'translateX(-50%)';
        
        translationBox.style.textAlign = 'right'; // Right align text for Persian
        translationBox.style.fontFamily = 'Segoe UI, Tahoma, sans-serif'; // Original font
        translationBox.style.fontSize = '16px'; // Increased font size for better readability
        translationBox.style.color = '#333'; // Darker text color for contrast
        translationBox.style.direction = 'rtl'; // Right-to-left for Persian text
        translationBox.style.maxHeight = '80vh'; // Maximum height of 80% of viewport height
        translationBox.style.overflowY = 'auto'; // Add scrolling for long content
        translationBox.style.overflowX = 'hidden'; // Prevent horizontal scrolling
        translationBox.style.boxSizing = 'border-box'; // Include padding in width calculation

        // Close button
        let closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.position = 'sticky';
        closeButton.style.top = '0';
        closeButton.style.right = '0';
        closeButton.style.float = 'left'; // Float to left (appears on right in RTL)
        closeButton.style.marginBottom = '10px';
        closeButton.style.marginLeft = '10px';
        closeButton.style.backgroundColor = '#f44336'; // Red background for close button
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '5px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.zIndex = '1001'; // Ensure it's above other content
        closeButton.addEventListener('click', function() {
            document.body.removeChild(translationBox);
        });
        translationBox.appendChild(closeButton);

        // Add the translation text
        let translationText = document.createElement('div'); // Changed from 'p' to 'div'
        translationText.innerHTML = preserveTextFormatting(translation); // Use innerHTML with formatted text
        translationText.style.marginTop = '10px'; // Reduced space above the text
        translationText.style.color = 'black'; // Text color
        translationText.style.lineHeight = '1.5'; // Improved line height for readability
        translationText.style.wordWrap = 'break-word'; // Ensure long words don't overflow
        translationText.style.clear = 'both'; // Clear the float from the close button
        translationText.style.width = '100%'; // Ensure full width
        translationText.style.boxSizing = 'border-box'; // Include padding in width calculation

        // Process links and bold text in the translation
        setTimeout(() => {
            // Process all links to open in new tab and have proper styling
            const links = translationText.querySelectorAll('a');
            links.forEach(link => {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
                link.style.color = '#0066cc';
                link.style.textDecoration = 'underline';
                link.style.fontWeight = 'bold';
            });
            
            // Ensure bold elements are actually bold
            const boldElements = translationText.querySelectorAll('b, strong');
            boldElements.forEach(el => {
                el.style.fontWeight = 'bold';
            });
            
            // Ensure italic elements are actually italic
            const italicElements = translationText.querySelectorAll('i, em');
            italicElements.forEach(el => {
                el.style.fontStyle = 'italic';
            });
        }, 0);

        translationBox.appendChild(translationText);
        document.body.appendChild(translationBox);
        
        // Adjust box position and size after it's added to the DOM
        adjustTranslationBoxForViewport(translationBox);

        // Add resize event listener to adjust box size on window resize
        window.addEventListener('resize', function() {
            adjustTranslationBoxForViewport(translationBox);
        });

        // Add click listener to close the box when clicking outside
        const clickOutsideHandler = function(e) {
            if (!translationBox.contains(e.target)) {
                document.body.removeChild(translationBox);
                document.removeEventListener('click', clickOutsideHandler);
            }
        };
        document.addEventListener('click', clickOutsideHandler);
    } else {
        let translationText = translationBox.querySelector('div'); // Changed from 'p' to 'div'
        translationText.innerHTML = preserveTextFormatting(translation); // Use innerHTML with formatted text
        
        // Process links and bold text in the translation
        setTimeout(() => {
            // Process all links to open in new tab and have proper styling
            const links = translationText.querySelectorAll('a');
            links.forEach(link => {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
                link.style.color = '#0066cc';
                link.style.textDecoration = 'underline';
                link.style.fontWeight = 'bold';
            });
            
            // Ensure bold elements are actually bold
            const boldElements = translationText.querySelectorAll('b, strong');
            boldElements.forEach(el => {
                el.style.fontWeight = 'bold';
            });
            
            // Ensure italic elements are actually italic
            const italicElements = translationText.querySelectorAll('i, em');
            italicElements.forEach(el => {
                el.style.fontStyle = 'italic';
            });
        }, 0);
        
        // Re-adjust box position and size for new content
        adjustTranslationBoxForViewport(translationBox);
    }
}

// Function to display HTML translation in a new box
function displayHtmlTranslation(translation) {
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
        
        // Initial positioning - will be adjusted by adjustTranslationBoxForViewport
        translationBox.style.top = '10%';
        translationBox.style.left = '50%';
        translationBox.style.transform = 'translateX(-50%)';
        
        translationBox.style.textAlign = 'right'; // Right align text for Persian
        translationBox.style.fontFamily = 'Segoe UI, Tahoma, sans-serif'; // Original font
        translationBox.style.fontSize = '16px'; // Increased font size for better readability
        translationBox.style.color = '#333'; // Darker text color for contrast
        translationBox.style.direction = 'rtl'; // Right-to-left for Persian text
        translationBox.style.maxHeight = '80vh'; // Maximum height of 80% of viewport height
        translationBox.style.overflowY = 'auto'; // Add scrolling for long content
        translationBox.style.overflowX = 'hidden'; // Prevent horizontal scrolling
        translationBox.style.boxSizing = 'border-box'; // Include padding in width calculation

        // Close button
        let closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.position = 'sticky';
        closeButton.style.top = '0';
        closeButton.style.right = '0';
        closeButton.style.float = 'left'; // Float to left (appears on right in RTL)
        closeButton.style.marginBottom = '10px';
        closeButton.style.marginLeft = '10px';
        closeButton.style.backgroundColor = '#f44336'; // Red background for close button
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '5px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.zIndex = '1001'; // Ensure it's above other content
        closeButton.addEventListener('click', function() {
            document.body.removeChild(translationBox);
        });
        translationBox.appendChild(closeButton);

        // Add the translation text
        let translationText = document.createElement('div');
        
        // For HTML content, we need to sanitize it before inserting
        // Create a temporary div to sanitize the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = translation;
        
        // Remove potentially harmful elements
        const scripts = tempDiv.querySelectorAll('script');
        scripts.forEach(script => script.remove());
        
        // Process all elements to ensure proper styling
        const allElements = tempDiv.querySelectorAll('*');
        allElements.forEach(el => {
            // Remove event handlers
            const attributes = el.attributes;
            for (let i = attributes.length - 1; i >= 0; i--) {
                const attrName = attributes[i].name;
                if (attrName.startsWith('on') || (attrName === 'href' && attributes[i].value.startsWith('javascript:'))) {
                    el.removeAttribute(attrName);
                }
            }
            
            // Apply styling for elements with data-original-tag attribute
            if (el.hasAttribute('data-original-tag')) {
                const tagName = el.getAttribute('data-original-tag');
                applyDefaultStyling(el, tagName);
            }
            
            // Ensure bold elements are actually bold
            if (el.tagName.toLowerCase() === 'b' || el.tagName.toLowerCase() === 'strong') {
                el.style.fontWeight = 'bold';
            }
            
            // Ensure italic elements are actually italic
            if (el.tagName.toLowerCase() === 'i' || el.tagName.toLowerCase() === 'em') {
                el.style.fontStyle = 'italic';
            }
            
            // Ensure links are properly styled
            if (el.tagName.toLowerCase() === 'a') {
                el.style.color = '#0066cc'; // Bright blue color for better visibility
                el.style.textDecoration = 'underline';
                el.style.fontWeight = 'bold';
                
                // Add target="_blank" to open links in a new tab
                el.setAttribute('target', '_blank');
                
                // Add rel="noopener noreferrer" for security
                el.setAttribute('rel', 'noopener noreferrer');
            }
        });
        
        // Set the sanitized HTML
        translationText.innerHTML = tempDiv.innerHTML;
        
        // Add CSS for styling elements
        const styleElement = document.createElement('style');
        styleElement.textContent = `
          h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; }
          h2 { font-size: 1.5em; font-weight: bold; margin: 0.83em 0; }
          h3 { font-size: 1.17em; font-weight: bold; margin: 1em 0; }
          h4 { font-size: 1em; font-weight: bold; margin: 1.33em 0; }
          h5 { font-size: 0.83em; font-weight: bold; margin: 1.67em 0; }
          h6 { font-size: 0.67em; font-weight: bold; margin: 2.33em 0; }
          b, strong { font-weight: bold !important; }
          i, em { font-style: italic !important; }
          u { text-decoration: underline !important; }
          mark { background-color: yellow !important; color: black !important; }
          small { font-size: 0.83em !important; }
          del { text-decoration: line-through !important; }
          ins { text-decoration: underline !important; }
          sub { vertical-align: sub !important; font-size: smaller !important; }
          sup { vertical-align: super !important; font-size: smaller !important; }
          a { color: #0066cc !important; text-decoration: underline !important; font-weight: bold !important; }
          a:hover { text-decoration: underline !important; opacity: 0.8 !important; }
          a:visited { color: #551A8B !important; }
        `;
        translationText.appendChild(styleElement);
        
        translationText.style.marginTop = '10px'; // Reduced space above the text
        translationText.style.color = 'black'; // Text color
        translationText.style.lineHeight = '1.5'; // Improved line height for readability
        translationText.style.wordWrap = 'break-word'; // Ensure long words don't overflow
        translationText.style.clear = 'both'; // Clear the float from the close button
        translationText.style.width = '100%'; // Ensure full width
        translationText.style.boxSizing = 'border-box'; // Include padding in width calculation

        translationBox.appendChild(translationText);
        document.body.appendChild(translationBox);
        
        // Adjust box position and size after it's added to the DOM
        adjustTranslationBoxForViewport(translationBox);

        // Add resize event listener to adjust box size on window resize
        window.addEventListener('resize', function() {
            adjustTranslationBoxForViewport(translationBox);
        });

        // Add click listener to close the box when clicking outside
        const clickOutsideHandler = function(e) {
            if (!translationBox.contains(e.target)) {
                document.body.removeChild(translationBox);
                document.removeEventListener('click', clickOutsideHandler);
            }
        };
        document.addEventListener('click', clickOutsideHandler);
    } else {
        let translationText = translationBox.querySelector('div');
        
        // For HTML content, we need to sanitize it before inserting
        // Create a temporary div to sanitize the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = translation;
        
        // Remove potentially harmful elements
        const scripts = tempDiv.querySelectorAll('script');
        scripts.forEach(script => script.remove());
        
        // Process all elements to ensure proper styling
        const allElements = tempDiv.querySelectorAll('*');
        allElements.forEach(el => {
            // Remove event handlers
            const attributes = el.attributes;
            for (let i = attributes.length - 1; i >= 0; i--) {
                const attrName = attributes[i].name;
                if (attrName.startsWith('on') || (attrName === 'href' && attributes[i].value.startsWith('javascript:'))) {
                    el.removeAttribute(attrName);
                }
            }
            
            // Apply styling for elements with data-original-tag attribute
            if (el.hasAttribute('data-original-tag')) {
                const tagName = el.getAttribute('data-original-tag');
                applyDefaultStyling(el, tagName);
            }
            
            // Ensure bold elements are actually bold
            if (el.tagName.toLowerCase() === 'b' || el.tagName.toLowerCase() === 'strong') {
                el.style.fontWeight = 'bold';
            }
            
            // Ensure italic elements are actually italic
            if (el.tagName.toLowerCase() === 'i' || el.tagName.toLowerCase() === 'em') {
                el.style.fontStyle = 'italic';
            }
            
            // Ensure links are properly styled
            if (el.tagName.toLowerCase() === 'a') {
                el.style.color = '#0066cc'; // Bright blue color for better visibility
                el.style.textDecoration = 'underline';
                el.style.fontWeight = 'bold';
                
                // Add target="_blank" to open links in a new tab
                el.setAttribute('target', '_blank');
                
                // Add rel="noopener noreferrer" for security
                el.setAttribute('rel', 'noopener noreferrer');
            }
        });
        
        // Set the sanitized HTML
        translationText.innerHTML = tempDiv.innerHTML;
        
        // Re-adjust box position and size for new content
        adjustTranslationBoxForViewport(translationBox);
    }
}

// Function to apply default styling based on tag name
function applyDefaultStyling(element, tagName) {
    switch (tagName) {
        case 'h1':
            element.style.fontSize = '2em';
            element.style.fontWeight = 'bold';
            element.style.margin = '0.67em 0';
            break;
        case 'h2':
            element.style.fontSize = '1.5em';
            element.style.fontWeight = 'bold';
            element.style.margin = '0.83em 0';
            break;
        case 'h3':
            element.style.fontSize = '1.17em';
            element.style.fontWeight = 'bold';
            element.style.margin = '1em 0';
            break;
        case 'h4':
            element.style.fontSize = '1em';
            element.style.fontWeight = 'bold';
            element.style.margin = '1.33em 0';
            break;
        case 'h5':
            element.style.fontSize = '0.83em';
            element.style.fontWeight = 'bold';
            element.style.margin = '1.67em 0';
            break;
        case 'h6':
            element.style.fontSize = '0.67em';
            element.style.fontWeight = 'bold';
            element.style.margin = '2.33em 0';
            break;
        case 'b':
        case 'strong':
            element.style.fontWeight = 'bold';
            break;
        case 'i':
        case 'em':
            element.style.fontStyle = 'italic';
            break;
        case 'u':
            element.style.textDecoration = 'underline';
            break;
        case 'mark':
            element.style.backgroundColor = 'yellow';
            element.style.color = 'black';
            break;
        case 'small':
            element.style.fontSize = '0.83em';
            break;
        case 'del':
            element.style.textDecoration = 'line-through';
            break;
        case 'ins':
            element.style.textDecoration = 'underline';
            break;
        case 'sub':
            element.style.verticalAlign = 'sub';
            element.style.fontSize = 'smaller';
            break;
        case 'sup':
            element.style.verticalAlign = 'super';
            element.style.fontSize = 'smaller';
            break;
        case 'a':
            element.style.color = '#0066cc';
            element.style.textDecoration = 'underline';
            element.style.fontWeight = 'bold';
            break;
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
            translationBox.style.padding = '15px'; // Increased padding
            
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
            translationBox.style.maxWidth = '100%'; // Ensure it doesn't overflow container
            translationBox.style.wordWrap = 'break-word'; // Ensure long words don't overflow
            translationBox.style.overflowX = 'hidden'; // Prevent horizontal scrolling
            translationBox.style.boxSizing = 'border-box'; // Include padding in width calculation
            
            // For very long translations, add max height with scrolling
            translationBox.style.maxHeight = '500px'; // Maximum height for very long translations
            translationBox.style.overflowY = 'auto'; // Add vertical scrolling if needed
            
            // Create a container for the translation text
            const translationText = document.createElement('div');
            translationText.innerHTML = preserveTextFormatting(translation); // Use innerHTML with formatted text
            translationText.style.lineHeight = '1.5'; // Improved line height for readability
            translationText.style.width = '100%'; // Ensure full width
            
            // Process links and bold text in the translation
            setTimeout(() => {
                // Process all links to open in new tab and have proper styling
                const links = translationText.querySelectorAll('a');
                links.forEach(link => {
                    link.setAttribute('target', '_blank');
                    link.setAttribute('rel', 'noopener noreferrer');
                    
                    // Set link color based on theme
                    if (isDarkMode) {
                        link.style.color = '#1d9bf0'; // Twitter blue for dark mode
                    } else {
                        link.style.color = '#0066cc'; // Bright blue for light mode
                    }
                    
                    link.style.textDecoration = 'underline';
                    link.style.fontWeight = 'bold';
                });
                
                // Ensure bold elements are actually bold
                const boldElements = translationText.querySelectorAll('b, strong');
                boldElements.forEach(el => {
                    el.style.fontWeight = 'bold';
                });
                
                // Ensure italic elements are actually italic
                const italicElements = translationText.querySelectorAll('i, em');
                italicElements.forEach(el => {
                    el.style.fontStyle = 'italic';
                });
            }, 0);
            
            translationBox.appendChild(translationText);
            
            // Add re-translate button
            const retranslateButton = document.createElement('button');
            retranslateButton.textContent = 'بازترجمه';
            retranslateButton.style.marginTop = '15px'; // Increased margin
            retranslateButton.style.padding = '8px 12px'; // Increased padding
            retranslateButton.style.backgroundColor = '#1d9bf0'; // Twitter blue color
            retranslateButton.style.color = 'white';
            retranslateButton.style.border = 'none';
            retranslateButton.style.borderRadius = '5px';
            retranslateButton.style.cursor = 'pointer';
            retranslateButton.style.fontSize = '14px'; // Slightly larger font
            retranslateButton.style.display = 'block'; // Make it a block element
            
            retranslateButton.addEventListener('click', async () => {
                retranslateButton.disabled = true;
                retranslateButton.textContent = 'در حال ترجمه...';
                
                try {
                    // Clear translation cache for this text to get a fresh translation
                    translationCache.delete(textContent);
                    const newTranslation = await translateText(textContent);
                    if (newTranslation) {
                        translationText.innerHTML = preserveTextFormatting(newTranslation); // Use innerHTML with formatted text
                        
                        // Process links and bold text in the new translation
                        setTimeout(() => {
                            // Process all links to open in new tab and have proper styling
                            const links = translationText.querySelectorAll('a');
                            links.forEach(link => {
                                link.setAttribute('target', '_blank');
                                link.setAttribute('rel', 'noopener noreferrer');
                                
                                // Set link color based on theme
                                if (isDarkMode) {
                                    link.style.color = '#1d9bf0'; // Twitter blue for dark mode
                                } else {
                                    link.style.color = '#0066cc'; // Bright blue for light mode
                                }
                                
                                link.style.textDecoration = 'underline';
                                link.style.fontWeight = 'bold';
                            });
                            
                            // Ensure bold elements are actually bold
                            const boldElements = translationText.querySelectorAll('b, strong');
                            boldElements.forEach(el => {
                                el.style.fontWeight = 'bold';
                            });
                            
                            // Ensure italic elements are actually italic
                            const italicElements = translationText.querySelectorAll('i, em');
                            italicElements.forEach(el => {
                                el.style.fontStyle = 'italic';
                            });
                        }, 0);
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
