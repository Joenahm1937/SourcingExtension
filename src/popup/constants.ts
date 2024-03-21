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
    SETTINGS_UPDATE: 'update_settings',
} as const;

export const RESET_BUTTON_TEXT = 'RESET';

export const isWorkerMessage = (
    message: IMessage
): message is IWorkerMessage => {
    return message.source === 'Worker';
};
