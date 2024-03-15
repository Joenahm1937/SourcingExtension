import type { IContentScriptMessage, ITabData } from '../interfaces';
import { DOMHelper } from './DomHelper';

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
        const buttons = await DOMHelper.findAllNodes<HTMLElement>('button');
        const followButtons = DOMHelper.filterElementsByText(text, buttons);
        const mainFollowButton = DOMHelper.findHighestElement(followButtons);
        mainFollowButton?.click();
    };

    const followUser = async () => {
        toggleFollowButton(FOLLOW_BUTTON_TEXT);
    };

    const unfollowUser = async () => {
        await DOMHelper.findNodeByText(FOLLOWING_BUTTON_TEXT);
        toggleFollowButton(FOLLOWING_BUTTON_TEXT);
        const dialogBox = await DOMHelper.findNode('[role="dialog"]');
        if (dialogBox) {
            await DOMHelper.findNodeByText(UNFOLLOW_BUTTON_TEXT, dialogBox);
            const buttons = await DOMHelper.findAllNodes<HTMLElement>(
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
        const similarAccountsAnchorElement = await DOMHelper.findNode(
            '[href$="similar_accounts/"]'
        );
        if (similarAccountsAnchorElement) {
            const similarAccountsList =
                DOMHelper.findNodeUpwards<HTMLUListElement>(
                    'ul',
                    similarAccountsAnchorElement
                );
            if (similarAccountsList) {
                const childAnchorElements =
                    await DOMHelper.findAllNodes<HTMLAnchorElement>(
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
        const profileImageUrl = await DOMHelper.findNode<HTMLImageElement>(
            `[alt$="${user}\'s profile picture"]`
        );
        if (profileImageUrl instanceof HTMLImageElement)
            return profileImageUrl.src;
    };

    const getFollowerCount = async (): Promise<string | undefined> => {
        const followerCountElement = await DOMHelper.findNode<HTMLElement>(
            '[href$="followers/"]'
        );
        if (followerCountElement instanceof HTMLElement)
            return followerCountElement.innerText;
    };

    const getBioLinkUrls = async (): Promise<string[]> => {
        // Trying multi-link option first
        const linkSVG = await DOMHelper.findNode('[aria-label="Link icon"]');
        const openLinkDialogBoxButton = linkSVG?.closest('button');
        const bioLinks: string[] = [];
        if (openLinkDialogBoxButton) {
            openLinkDialogBoxButton.click();
            const dialogBox = await DOMHelper.findNode('[role="dialog"]');
            if (dialogBox) {
                const multiLinkUrls =
                    await DOMHelper.findAllNodes<HTMLAnchorElement>(
                        '[href^="https://l.instagram.com"]',
                        dialogBox
                    );
                multiLinkUrls.forEach((a) => {
                    const linkUrlContainer = a.innerText.split('\n');
                    const linkUrl =
                        linkUrlContainer.length > 1
                            ? linkUrlContainer[1]
                            : linkUrlContainer[0];
                    bioLinks.push(linkUrl);
                });
                const closeElement = await DOMHelper.findNode<HTMLElement>(
                    '[aria-label="Close"]',
                    dialogBox
                );
                closeElement?.click();
            }
        } else {
            const singleLinkUrl = await DOMHelper.findNode<HTMLAnchorElement>(
                '[href^="https://l.instagram.com"]'
            );
            if (
                singleLinkUrl instanceof HTMLAnchorElement &&
                singleLinkUrl.innerText !== 'Contact Uploading & Non-Users'
            ) {
                bioLinks.push(singleLinkUrl.innerText);
            }
        }
        return bioLinks;
    };

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
        const errorTabData: ITabData = {
            user,
            url: document.URL,
            followerCount,
            profileImageUrl,
            bioLinkUrls,
            suggestedProfiles,
            errorStack: DOMHelper.errorStack,
        };
        const message: IContentScriptMessage = {
            source: 'ContentScript',
            signal: 'complete',
            tabData: errorTabData,
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
