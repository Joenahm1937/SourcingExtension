import { PopupToBackgroundMessage } from '../interfaces';

const maxTabs = 3; // Limit Performance Issues
let openTabs = 0;
let tabURLQueue: string[] = [];
let isRunning = false;
let currentRunningProcess: number;

const processNextTab = () => {
    if (openTabs < maxTabs && tabURLQueue.length > 0 && isRunning) {
        const profileUrl = tabURLQueue.shift();
        openTabs++;
        console.log(`PROCESSING ${profileUrl}`);
        // chrome.tabs.create({ url: profileUrl, active: false }, (tab) => {
        // Will run the Content Script which will collect data from the page and save to local storage
        // Listen for process completion message from the Content Script to close tab
        // The Content Script will collect urls which we should add to the tabURLQueue (in our case, suggested profile pages)
        // For now, a mock is provided which will close the tab after 10 seconds, and add 2 Fake URLs to process next
        // We also send the updatePopup action message to the content script
        // });
        currentRunningProcess = setTimeout(() => {
            console.log(`COMPLETED PROCESSING ${profileUrl}`);
            openTabs--;

            // Simulate adding 2 fake URLs to the queue as if they were collected by the content script
            const newProfile1 = `https://www.instagram.com/suggestedProfile${Date.now()}/`;
            const newProfile2 = `https://www.instagram.com/suggestedProfile${
                Date.now() + 1
            }/`;
            tabURLQueue.push(newProfile1, newProfile2);

            // Simulate sending an update to the popup
            console.log('Sending updatePopup message to popup...');

            // Continue processing the next tab in the queue
            processNextTab();
        }, 6000); // 8 seconds delay to simulate tab processing time
    } else if (openTabs === 0 && tabURLQueue.length === 0 && isRunning) {
        isRunning = false;
    }
};

const startContentScript = (initialTabURL: string) => {
    console.log('STARTING CONTENT SCRIPT');
    isRunning = true;
    tabURLQueue.push(initialTabURL);
    processNextTab();
};

const stopProcess = () => {
    console.log('STOP PROCESS');
    isRunning = false;
    clearTimeout(currentRunningProcess);
};

const handleMessage = (
    message: PopupToBackgroundMessage,
    _: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
) => {
    switch (message.action) {
        case 'startContentScript':
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (
                    tabs[0] &&
                    tabs[0].url &&
                    /https:\/\/www\.instagram\.com\/[^\/]+\/?/.test(tabs[0].url)
                ) {
                    startContentScript(tabs[0].url);
                    sendResponse({ success: true });
                } else {
                    sendResponse({
                        success: false,
                        message: 'Not an Instagram profile page.',
                    });
                }
            });
            return true;
        case 'stopContentScript':
            stopProcess();
            sendResponse({ success: true });
            break;
        default:
            sendResponse({ success: false, message: 'Unrecognized action.' });
            break;
    }
};

chrome.runtime.onMessage.addListener(handleMessage);
