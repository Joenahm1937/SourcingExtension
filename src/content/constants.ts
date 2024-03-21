import type {
    IMessage,
    IScriptContextMessage,
    IWorkerMessage,
} from '../interfaces';

export const CONTENT_SCRIPT_SIGNAL = {
    COMPLETE: 'complete',
} as const;

export const isWorkerMessage = (
    message: IMessage
): message is IWorkerMessage => {
    return message.source === 'Worker';
};

export const isScriptContextMessage = (
    message: IWorkerMessage
): message is IScriptContextMessage => {
    return message.signal === 'send_context';
};
