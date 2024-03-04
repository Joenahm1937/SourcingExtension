export interface IPageData {
    profile: string;
}

export interface IUpdateMessage {
    action?: string;
    data?: IPageData;
}
