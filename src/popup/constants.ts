import { IMessage, IWorkerMessage } from '../interfaces';

export const BUTTON_TEXT = {
    RUNNING: 'STOP',
    REST: 'START',
} as const;

export const POPUP_SIGNAL = {
    START: 'start',
    STOP: 'stop',
} as const;

export const isWorkerMessage = (
    message: IMessage
): message is IWorkerMessage => {
    return message.source === 'Worker';
};
