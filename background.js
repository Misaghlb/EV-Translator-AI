chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed and ready to go.');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getLanguages') {
        chrome.storage.sync.get(['selectedLanguages'], (data) => {
            const languages = data.selectedLanguages || ['auto'];
            sendResponse({ languages });
        });
        return true; // Allow non-blocking response
    }
    
    // Handle screenshot capture request
    if (request.action === 'captureVisibleTab') {
        console.log('Capturing screenshot...');
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, async (dataUrl) => {
            if (chrome.runtime.lastError) {
                console.error('Screenshot capture error:', chrome.runtime.lastError);
                sendResponse({ error: chrome.runtime.lastError.message });
                return;
            }
            
            console.log('Screenshot captured successfully');
            
            // If area is specified, crop the image
            if (request.area) {
                console.log('Cropping to specified area:', request.area);
                try {
                    const croppedDataUrl = await cropImageOffscreen(dataUrl, request.area);
                    sendResponse({ imageDataUrl: croppedDataUrl });
                } catch (error) {
                    console.error('Error cropping image:', error);
                    sendResponse({ error: error.message });
                }
            } else {
                sendResponse({ imageDataUrl: dataUrl });
            }
        });
        return true; // Allow non-blocking response
    }
});

// Function to crop an image using OffscreenCanvas
async function cropImageOffscreen(dataUrl, area) {
    // Create a blob from the data URL
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    // Create an array buffer from the blob
    const arrayBuffer = await blob.arrayBuffer();
    
    // Create a bitmap from the array buffer
    const bitmap = await createImageBitmap(new Blob([arrayBuffer]));
    
    // Determine scale to match screenshot resolution (device pixel ratio)
    const scale = (typeof area.scale === 'number' && area.scale > 0) ? area.scale : 1;
    const sourceLeft = Math.round(area.left * scale);
    const sourceTop = Math.round(area.top * scale);
    const sourceWidth = Math.round(area.width * scale);
    const sourceHeight = Math.round(area.height * scale);

    // Create an OffscreenCanvas at the scaled size for best quality
    const canvas = new OffscreenCanvas(sourceWidth, sourceHeight);
    const ctx = canvas.getContext('2d');
    
    // Draw the cropped portion of the image using scaled coordinates
    ctx.drawImage(
        bitmap,
        sourceLeft, sourceTop, sourceWidth, sourceHeight,
        0, 0, sourceWidth, sourceHeight
    );
    
    // Convert to blob and then to data URL
    const croppedBlob = await canvas.convertToBlob({ type: 'image/png' });
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(croppedBlob);
    });
}
