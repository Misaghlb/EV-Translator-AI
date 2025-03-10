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
});
