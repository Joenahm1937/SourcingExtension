import { WORKER_SIGNAL } from './background/constants';
import { CONTENT_SCRIPT_SIGNAL } from './content/constants';
import { RUNNING_STATE } from './popup/constants';

export type Component = 'Worker' | 'Popup' | 'ContentScript';

export interface IMessage {
    source: Component;
}

export interface IResponse {
    success: boolean;
    message?: string;
}

export interface IPopupMessage extends IMessage {
    signal: (typeof RUNNING_STATE)[keyof typeof RUNNING_STATE];
}

export interface IWorkerMessage extends IMessage {
    signal: (typeof WORKER_SIGNAL)[keyof typeof WORKER_SIGNAL];
}

export interface IContentScriptMessage extends IMessage {
    signal: (typeof CONTENT_SCRIPT_SIGNAL)[keyof typeof CONTENT_SCRIPT_SIGNAL];
    tabData: ITabData;
}

export interface IPopupMessageHandler {
    /**
     *
     * @param message
     * @param sendResponse
     * @returns boolean - Returns true to Signal Async Response
     * Refer to https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage
     */
    processMessage: (
        message: IPopupMessage,
        sendResponse: (response: IResponse) => void
    ) => boolean;
}

export interface IContentScriptMessageHandler {
    processMessage: (
        message: IContentScriptMessage,
        sender: chrome.runtime.MessageSender
    ) => void;
}

type SerializableValue =
    | string
    | number
    | boolean
    | SerializableObject
    | SerializableArray;
type SerializableObject = { [key: string]: SerializableValue };
type SerializableArray = SerializableValue[];

export interface ITabData extends SerializableObject {
    url: string;
    name: string;
}

export interface ILocalStorage {
    isRunning: boolean;
    tabs: ITabData[];
}

export type LocalStorageKeys = keyof ILocalStorage;
