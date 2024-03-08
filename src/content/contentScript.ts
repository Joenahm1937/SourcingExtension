import type { ITabData, IContentScriptMessage } from '../interfaces';
(() => {
    function getRandomInt(min: number, max: number): number {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // For now, simulate large variations of time when running content script
    setTimeout(() => {
        const data: ITabData = {
            url: getRandomInt(0, 10000).toString(),
            name: getRandomInt(0, 10000).toString(),
        };
        const message: IContentScriptMessage = {
            source: 'ContentScript',
            signal: 'complete',
            tabData: data,
        };

        chrome.runtime.sendMessage(message);
    }, getRandomInt(2, 8) * 1000);
})();
