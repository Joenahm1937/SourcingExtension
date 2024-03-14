import type { IContentScriptMessage, ITabData } from '../interfaces';
import { DOMHelper } from './DomHelper';

// TODO: Make all queryStrings constants and move to constants file
const MAX_ACTION_TIMEOUT_MS = 20000;

const FOLLOW_BUTTON_TEXT = 'FOLLOW'; //Can be FOLLOW or FOLLOW BACK
const FOLLOWING_BUTTON_TEXT = 'FOLLOWING';
const UNFOLLOW_BUTTON_TEXT = 'UNFOLLOW';

// Instagram Profile Page Specific Content Script
(async () => {
    const sleep = (timeMs: number): Promise<void> => {
        return new Promise((resolve) => setTimeout(resolve, timeMs));
    };

    const getNameFromUrl = (url: string): string => {
        const match = url.match(/https:\/\/www\.instagram\.com\/(.+?)\//);
        return match ? match[1] : '';
    };
    const user = getNameFromUrl(document.URL);

    const toggleFollowButton = async (text: string) => {
        const buttons =
            await DOMHelper.waitUntilSingleMatchPresent<HTMLElement>(
                'button',
                MAX_ACTION_TIMEOUT_MS
            );
        const followButtons = DOMHelper.filterElementsByText(text, buttons);
        const mainFollowButton = DOMHelper.findHighestElement(followButtons);
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
            const unFollowButton = DOMHelper.filterElementsByText(
                UNFOLLOW_BUTTON_TEXT,
                buttons
            )[0];
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

    const getProfileImageUrl = async (): Promise<string | undefined> => {
        const bioLinkUrl =
            await DOMHelper.waitUntilElementPresent<HTMLImageElement>(
                `[alt$="${user}\'s profile picture"]`,
                MAX_ACTION_TIMEOUT_MS
            );
        if (bioLinkUrl instanceof HTMLImageElement) return bioLinkUrl.src;
    };

    const getFollowerCount = async (): Promise<string | undefined> => {
        const followerCountElement =
            await DOMHelper.waitUntilElementPresent<HTMLElement>(
                '[href$="followers/"]',
                MAX_ACTION_TIMEOUT_MS
            );
        if (followerCountElement instanceof HTMLElement)
            return followerCountElement.innerText;
    };

    const getBioLinkUrls = async (): Promise<string[] | undefined> => {
        // Trying multi-link option first
        const linkSVG = await DOMHelper.waitUntilElementPresent(
            '[aria-label="Link icon"]',
            MAX_ACTION_TIMEOUT_MS
        );
        const openLinkDialogBoxButton = linkSVG?.closest('button');
        const bioLinks: string[] = [];
        if (openLinkDialogBoxButton) {
            openLinkDialogBoxButton.click();
            const dialogBox = await DOMHelper.waitUntilElementPresent(
                '[role="dialog"]',
                MAX_ACTION_TIMEOUT_MS
            );
            if (dialogBox) {
                const multiLinkUrls =
                    await DOMHelper.waitUntilSingleMatchPresent<HTMLAnchorElement>(
                        '[href^="https://l.instagram.com"]',
                        MAX_ACTION_TIMEOUT_MS,
                        dialogBox
                    );
                multiLinkUrls.forEach((a) => {
                    const linkUrl = a.innerText.split('\n')[1];
                    bioLinks.push(linkUrl);
                });
                const closeElement =
                    await DOMHelper.waitUntilElementPresent<HTMLElement>(
                        '[aria-label="Close"]',
                        MAX_ACTION_TIMEOUT_MS,
                        dialogBox
                    );
                closeElement?.click();
            }
        } else {
            const singleLinkUrl =
                await DOMHelper.waitUntilElementPresent<HTMLAnchorElement>(
                    '[href^="https://l.instagram.com"]',
                    MAX_ACTION_TIMEOUT_MS
                );
            if (singleLinkUrl instanceof HTMLAnchorElement)
                return singleLinkUrl.innerText !==
                    'Contact Uploading & Non-Users'
                    ? [singleLinkUrl.innerText]
                    : undefined;
        }
        return bioLinks;
    };

    // document.querySelector('[href^="https://l.instagram.com"]').href

    // We need to check if user is already following vs. network latency
    // We can probably use promise.race to test whether follow or unfollow button is present
    // If unfollow button, then we've already visited this profile and we can skip
    await followUser();
    const followerCount = await getFollowerCount();
    const suggestedProfiles = await getSuggestedProfiles();
    const profileImageUrl = await getProfileImageUrl();
    const bioLinkUrls = await getBioLinkUrls();
    await unfollowUser();
    await sleep(1000);

    if (DOMHelper.hasErrored) {
        let errorMessage = DOMHelper.errorRootCause as string;
        const errorTabData: ITabData = {
            user,
            url: document.URL,
            followerCount,
            profileImageUrl,
            bioLinkUrls,
            suggestedProfiles,
            errorMessage,
        };
        const message: IContentScriptMessage = {
            source: 'ContentScript',
            signal: 'complete',
            tabData: errorTabData,
            errorMessage,
        };
        chrome.runtime.sendMessage(message);
    } else {
        const tabData: ITabData = {
            user,
            url: document.URL,
            followerCount,
            profileImageUrl,
            bioLinkUrls,
            suggestedProfiles: suggestedProfiles || [],
        };
        const message: IContentScriptMessage = {
            source: 'ContentScript',
            signal: 'complete',
            tabData: tabData,
        };
        chrome.runtime.sendMessage(message);
    }
})();
