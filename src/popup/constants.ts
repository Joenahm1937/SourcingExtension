import { IMessage, IWorkerMessage } from '../interfaces';

export const EXTENSION_HEADER = 'Sourcing Assistant';

export const TOGGLE_RUNNING_STATE = {
    RUNNING: 'STOP',
    REST: 'START',
} as const;

export const POPUP_SIGNAL = {
    START: 'start',
    STOP: 'stop',
    RESTART: 'restart',
} as const;

export const RESET_BUTTON_TEXT = 'RESET';
export const DOWNLOAD_BUTTON_TEXT = 'DOWNLOAD';

export const isWorkerMessage = (
    message: IMessage
): message is IWorkerMessage => {
    return message.source === 'Worker';
};
