import type { IContentScriptMessage, ITabData } from '../interfaces';
import { DOMHelper } from './DomHelper';

// TODO: Make all queryStrings constants and move to constants file
const MAX_ACTION_TIMEOUT_MS = 20000;

const FOLLOW_BUTTON_TEXT = 'FOLLOW'; //Can be FOLLOW or FOLLOW BACK
const FOLLOWING_BUTTON_TEXT = 'FOLLOWING';
const UNFOLLOW_BUTTON_TEXT = 'UNFOLLOW';

// Instagram Profile Page Specific Content Script
(async () => {
    const toggleFollowButton = async (text: string) => {
        const buttons =
            await DOMHelper.waitUntilSingleMatchPresent<HTMLElement>(
                'button',
                MAX_ACTION_TIMEOUT_MS
            );
        const followButtons = DOMHelper.filterElementsByText(text, buttons);
        const mainFollowButton = DOMHelper.findHighestElement(followButtons);
        console.log('MAINFOLLOWBUTTON', mainFollowButton, text);
        mainFollowButton?.click();
    };

    const followUser = async () => {
        toggleFollowButton(FOLLOW_BUTTON_TEXT);
    };

    const unfollowUser = async () => {
        await DOMHelper.waitUntilElementContainingTextPresent(
            FOLLOWING_BUTTON_TEXT,
            MAX_ACTION_TIMEOUT_MS
        );
        toggleFollowButton(FOLLOWING_BUTTON_TEXT);
        const dialogBox = await DOMHelper.waitUntilElementPresent(
            '[role="dialog"]',
            MAX_ACTION_TIMEOUT_MS
        );
        if (dialogBox) {
            await DOMHelper.waitUntilElementContainingTextPresent(
                UNFOLLOW_BUTTON_TEXT,
                MAX_ACTION_TIMEOUT_MS,
                dialogBox
            );
            const buttons = DOMHelper.findAllNodes<HTMLElement>(
                '[role="button"]',
                dialogBox
            );
            console.log('BUTTONS,', buttons);
            const unFollowButton = DOMHelper.filterElementsByText(
                UNFOLLOW_BUTTON_TEXT,
                buttons
            )[0];
            console.log('unFollowButton,', unFollowButton);
            unFollowButton?.click();
        }
    };

    const getSuggestedProfiles = async (): Promise<string[] | undefined> => {
        const similarAccountsAnchorElement =
            await DOMHelper.waitUntilElementPresent(
                '[href$="similar_accounts/"]',
                MAX_ACTION_TIMEOUT_MS
            );
        if (similarAccountsAnchorElement) {
            const similarAccountsList =
                DOMHelper.findNodeUpwards<HTMLUListElement>(
                    'ul',
                    similarAccountsAnchorElement
                );
            if (similarAccountsList) {
                const childAnchorElements =
                    DOMHelper.findAllNodes<HTMLAnchorElement>(
                        'a',
                        similarAccountsList
                    );
                const uniqueLinks = new Set<string>();
                childAnchorElements.forEach((link) =>
                    uniqueLinks.add(link.href)
                );
                return Array.from(uniqueLinks);
            }
        }
    };

    // We need to check if user is already following vs. network latency
    // We can probably use promise.race to test whether follow or unfollow button is present
    // If unfollow button, then we've already visited this profile and we can skip
    await followUser();
    const suggestedProfiles = await getSuggestedProfiles();
    console.log(suggestedProfiles);
    await unfollowUser();

    if (DOMHelper.hasErrored) {
        // We should populate with fields we were able to get
        const errorTabData: ITabData = {
            url: DOMHelper.hasErrored.toString(),
            name: DOMHelper.errorMessage as string,
            suggestedUrls: [],
        };
        const message: IContentScriptMessage = {
            source: 'ContentScript',
            signal: 'complete',
            tabData: errorTabData,
            errorMessage: DOMHelper.errorMessage as string,
        };
        chrome.runtime.sendMessage(message);
    } else {
        const tabData: ITabData = {
            url: 'test passed',
            name: JSON.stringify(suggestedProfiles),
            suggestedUrls: suggestedProfiles || [],
        };
        const message: IContentScriptMessage = {
            source: 'ContentScript',
            signal: 'complete',
            tabData: tabData,
        };
        chrome.runtime.sendMessage(message);
    }
})();
