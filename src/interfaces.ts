export interface IPageData {
    profile: string;
}

export const BackgroundToPopupAction = {
    updatePopup: 'updatePopup',
} as const;

export interface BackgroundToPopupMessage {
    action: keyof typeof BackgroundToPopupAction;
    data: IPageData;
}

export const PopupToBackgroundAction = {
    startContentScript: 'startContentScript',
    stopContentScript: 'stopContentScript',
} as const;

export interface PopupToBackgroundMessage {
    action: keyof typeof PopupToBackgroundAction;
}
