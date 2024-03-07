import type {
    IContentScriptMessageHandler,
    IPopupMessageHandler,
    IMessage,
    IResponse,
    IWorkerMessage,
} from '../interfaces';
import { isContentScriptMessage, isPopupMessage } from './constants';
import { TabsFacade } from './TabsFacade';

const PopupMessageHandler: IPopupMessageHandler = {
    processMessage(message, sendResponse) {
        if (message.signal === 'start') {
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
        }
        return false;
    },
};

const ContentScriptMessageHandler: IContentScriptMessageHandler = {
    processMessage(message, sender) {
        if (sender.tab) {
            TabsFacade.closeTab(sender.tab);
        }
        const workerMessage: IWorkerMessage = {
            source: 'Worker',
            signal: 'refresh',
            data: message.data,
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
