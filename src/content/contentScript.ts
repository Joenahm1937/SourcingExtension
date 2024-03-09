import type { IContentScriptMessage, ITabData } from '../interfaces';
import { DOMHelper } from './DomHelper';

// TODO: Make all queryStrings constants and move to constants file
const FOLLOW_BUTTON_TEXT = 'FOLLOW';
const UNFOLLOW_BUTTON_TEXT = 'UNFOLLOW';

// Instagram Profile Page Specific Content Script
(async () => {
    const toggleFollowButton = (
        text: string,
        node: Document | Element = document
    ) => {
        const buttons = DOMHelper.findAllNodes<HTMLElement>('button', node);
        const followButtons = DOMHelper.filterElementsByText(text, buttons);
        const mainFollowButton = DOMHelper.findHighestElement(followButtons);
        mainFollowButton?.click();
    };

    const followUser = async () => {
        toggleFollowButton(FOLLOW_BUTTON_TEXT);
        // wait for suggested profiles
    };

    const unfollowUser = async () => {
        toggleFollowButton(UNFOLLOW_BUTTON_TEXT);
        // wait for modal to appear
        const dialogBox = DOMHelper.findNode('[role="dialog"]');
        if (dialogBox) {
            toggleFollowButton(UNFOLLOW_BUTTON_TEXT, dialogBox);
        }
    };

    const getSuggestedProfiles = async () => {
        const similarAccountsAnchorElement = DOMHelper.findNode(
            '[href$="similar_accounts/"]'
        );
        if (similarAccountsAnchorElement) {
            const closestList = similarAccountsAnchorElement.closest('ul');
            if (closestList) {
                const childAnchorElements =
                    DOMHelper.findAllNodes<HTMLAnchorElement>(
                        'li > a',
                        closestList
                    );
                return childAnchorElements.map((link) => link.href);
            }
        }
    };

    await followUser();

    if (DOMHelper.hasErrored) {
        // We should populate with fields we were able to get
        const errorTabData: ITabData = {
            url: 'Failed to Retrieve URL',
            name: 'Failed to Retrieve User',
        };
        const message: IContentScriptMessage = {
            source: 'ContentScript',
            signal: 'complete',
            tabData: errorTabData,
            errorMessage: DOMHelper.errorType as string,
        };
        chrome.runtime.sendMessage(message);
    } else {
        const tabData: ITabData = {
            url: 'test passed',
            name: 'test passed',
        };
        const message: IContentScriptMessage = {
            source: 'ContentScript',
            signal: 'complete',
            tabData: tabData,
        };
    }
})();
