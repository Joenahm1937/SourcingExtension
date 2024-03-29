import type {
    IContentScriptMessageHandler,
    IPopupMessageHandler,
    IMessage,
    IResponse,
    IWorkerMessage,
} from '../interfaces';
import { LocalStorageWrapper } from '../LocalStorageWrapper';
import {
    isContentScriptMessage,
    isPopupMessage,
    isSettingsUpdateMessage,
} from './constants';
import { TabsFacade } from './TabsFacade';

const PopupMessageHandler: IPopupMessageHandler = {
    processMessage(message, sendResponse) {
        if (isSettingsUpdateMessage(message)) {
            TabsFacade.updateMaxTabs(message.payload.maxTabs);
            TabsFacade.updateScriptContext({
                enableStackTrace: message.payload.devMode,
            });
        } else if (message.signal === 'start') {
            TabsFacade.startProcessing((error?: Error) => {
                if (error) {
                    sendResponse({ success: false, message: error.message });
                } else {
                    sendResponse({
                        success: true,
                    });
                }
            });
            return true;
        } else if (message.signal === 'stop') {
            TabsFacade.stopProcessing();
            sendResponse({ success: true });
        } else if (message.signal === 'restart') {
            TabsFacade.flushQueue();
            sendResponse({ success: true });
        }
        return false;
    },
};

const ContentScriptMessageHandler: IContentScriptMessageHandler = {
    async processMessage(message, sender) {
        if (sender.tab) {
            TabsFacade.closeTab(sender.tab);
            if (message.tabData.suggestedProfiles)
                TabsFacade.enqueue(message.tabData.suggestedProfiles);
        }
        const tabData = message.tabData;
        const tabs = (await LocalStorageWrapper.get('tabs')) || [];
        tabs.push(tabData);
        await LocalStorageWrapper.set('tabs', tabs);
        const workerMessage: IWorkerMessage = {
            source: 'Worker',
            signal: 'refresh',
        };
        chrome.runtime.sendMessage(workerMessage);
    },
};

const messageRouter = (
    message: IMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: IResponse) => void
) => {
    if (isPopupMessage(message)) {
        const asyncResponse = PopupMessageHandler.processMessage(
            message,
            sendResponse
        );
        if (asyncResponse) return true;
    } else if (isContentScriptMessage(message)) {
        ContentScriptMessageHandler.processMessage(message, sender);
    } else {
        sendResponse({
            success: false,
            message: 'Unrecognized Source',
        });
    }
};

chrome.runtime.onMessage.addListener(messageRouter);
