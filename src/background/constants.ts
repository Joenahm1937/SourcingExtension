import type { IMessage, IPopupMessage } from '../interfaces';

export const INVALID_PAGE_ERROR =
    'Please navigate to an Instagram profile page.';

// The URL the tab is displaying is only present if the extension's manifest includes the "tabs" permission.
export const NO_TAB_PERMISSION_ERROR = 'No active tab found';

export const WORKER_SIGNAL = {
    REFRESH_POPUP: 'refresh',
} as const;

export const isPopupMessage = (message: IMessage): message is IPopupMessage => {
    return message.source === 'Popup';
};

export const INSTAGRAM_PROFILE_PAGE_REGEX = new RegExp(
    /https:\/\/www\.instagram\.com\/[^\/]+\/?/
);