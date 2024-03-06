import { WORKER_SIGNAL } from './background/constants';
import { POPUP_SIGNAL } from './popup/constants';

export type Component = 'Worker' | 'Popup' | 'ContentScript';

export interface IMessage {
    source: Component;
}

export interface IResponse {
    success: boolean;
    message?: string;
}

export interface IPopupMessage extends IMessage {
    signal: (typeof POPUP_SIGNAL)[keyof typeof POPUP_SIGNAL];
}

export interface IPopupHandler {
    processMessage: (
        message: IPopupMessage,
        sendResponse: (response: IResponse) => void
    ) => boolean;
}

export interface IWorkerMessage extends IMessage {
    signal: (typeof WORKER_SIGNAL)[keyof typeof WORKER_SIGNAL];
    // Remove data when refreshPages pulls from local storage instead
    data: string;
}

/**
 * Local Storage "Schema"
 */
export interface ILocalStore {
    urls: string[];
}
