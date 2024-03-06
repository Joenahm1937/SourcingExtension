import type { IMessage, IPopupHandler, IResponse } from '../interfaces';
import { isPopupMessage } from './constants';
import { TabsFacade } from './TabsFacade';

const PopupHandler: IPopupHandler = {
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
            // Returning True to Indicate Asynchronous Response Handling
            // Refer to https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage
            return true;
        } else if (message.signal === 'stop') {
            TabsFacade.stopProcessing();
            sendResponse({ success: true });
        }
        return false;
    },
};

const messageRouter = (
    message: IMessage,
    _: chrome.runtime.MessageSender,
    sendResponse: (response: IResponse) => void
) => {
    if (isPopupMessage(message)) {
        const asyncResponse = PopupHandler.processMessage(
            message,
            sendResponse
        );
        if (asyncResponse) return true;
    } else {
        sendResponse({
            success: false,
            message: 'Unrecognized Source',
        });
    }
};

chrome.runtime.onMessage.addListener(messageRouter);
