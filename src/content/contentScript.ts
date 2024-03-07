import type { IContentScriptMessage } from '../interfaces';
(() => {
    // For now, simulate large variations of time when running content script
    setTimeout(() => {
        const message: IContentScriptMessage = {
            source: 'ContentScript',
            signal: 'complete',
            data: 'Hello World',
        };

        chrome.runtime.sendMessage(message);
    }, Math.floor(Math.random() * (8 - 2 + 1)) + 2);
})();
