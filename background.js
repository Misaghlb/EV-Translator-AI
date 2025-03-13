chrome.runtime.onInstalled.addListener(() => {
    console.log('اکستنشن نصب شد و آماده به کار است.');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getLanguages') {
        chrome.storage.sync.get(['selectedLanguages'], (data) => {
            const languages = data.selectedLanguages || ['auto'];
            sendResponse({ languages });
        });
        return true; // اجازه پاسخ غیربلوک‌کننده
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
        return true; // اجازه پاسخ غیربلوک‌کننده
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
    
    // Create an OffscreenCanvas
    const canvas = new OffscreenCanvas(area.width, area.height);
    const ctx = canvas.getContext('2d');
    
    // Draw the cropped portion of the image
    ctx.drawImage(
        bitmap,
        area.left, area.top, area.width, area.height,
        0, 0, area.width, area.height
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
