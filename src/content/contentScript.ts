import type { IContentScriptMessage, IMessage, ITabData } from '../interfaces';
import { DOMHelper } from './DomHelper';
import { isScriptContextMessage, isWorkerMessage } from './constants';

const BUTTON_TEXTS = {
    follow: 'FOLLOW',
    following: 'FOLLOWING',
    unfollow: 'UNFOLLOW',
};

// Utility function to pause execution for a given time
const sleep = (timeMs: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, timeMs));

// Extracts username from the Instagram profile URL
const getUsernameFromUrl = (url: string): string => {
    const match = url.match(/https:\/\/www\.instagram\.com\/(.+?)\//);
    return match ? match[1] : '';
};

// Toggles follow/unfollow button based on text
const toggleFollowButton = async (buttonText: string): Promise<void> => {
    const buttons = await DOMHelper.findAllNodes<HTMLElement>('button');
    const targetButtons = DOMHelper.filterElementsByText(buttonText, buttons);
    const mainButton = DOMHelper.findHighestElement(targetButtons);
    mainButton?.click();
};

// Follows the user
const followUser = (): Promise<void> => toggleFollowButton(BUTTON_TEXTS.follow);

// Unfollows the user
const unfollowUser = async (): Promise<void> => {
    await toggleFollowButton(BUTTON_TEXTS.following);
    const dialogBox = await DOMHelper.findNode('[role="dialog"]');
    if (dialogBox) {
        await DOMHelper.findNodeByText(BUTTON_TEXTS.unfollow, dialogBox);
        const unFollowButton = DOMHelper.filterElementsByText(
            BUTTON_TEXTS.unfollow,
            await DOMHelper.findAllNodes<HTMLElement>(
                '[role="button"]',
                dialogBox
            )
        )[0];
        unFollowButton?.click();
    }
};

// Fetches suggested profiles
const getSuggestedProfileUrls = async (): Promise<string[] | undefined> => {
    const anchorElement = await DOMHelper.findNode(
        '[href$="similar_accounts/"]'
    );
    if (anchorElement) {
        const listElement = DOMHelper.findNodeUpwards<HTMLUListElement>(
            'ul',
            anchorElement
        );
        if (listElement) {
            const childAnchorElements =
                await DOMHelper.findAllNodes<HTMLAnchorElement>(
                    'a',
                    listElement
                );
            const uniqueLinks = new Set<string>();
            childAnchorElements.forEach((link) => uniqueLinks.add(link.href));
            return Array.from(uniqueLinks);
        }
    }
};

// Retrieves the profile image URL
const getProfileImageUrl = async (
    username: string
): Promise<string | undefined> => {
    const imageElement = await DOMHelper.findNode<HTMLImageElement>(
        `[alt$="${username}'s profile picture"]`
    );
    return imageElement?.src;
};

// Obtains follower count
const getFollowerCount = async (): Promise<string | undefined> => {
    const followerCountElement = await DOMHelper.findNode<HTMLElement>(
        '[href$="followers/"]'
    );
    return followerCountElement?.innerText;
};

// Extracts bio link URLs
const getBioLinkUrls = async (): Promise<string[]> => {
    const bioLinks: string[] = [];
    const linkSVG = await DOMHelper.findNode('[aria-label="Link icon"]');

    if (linkSVG) {
        // Clicks the button if there's a multi-link (i.e., link tree in bio)
        const openLinkDialogBoxButton = linkSVG.closest('button');
        if (openLinkDialogBoxButton) {
            openLinkDialogBoxButton.click();

            // Waits for the dialog box to appear after click event
            const dialogBox = await DOMHelper.findNode('[role="dialog"]');
            if (dialogBox) {
                // Extracts all links within the dialog
                const multiLinkUrls =
                    await DOMHelper.findAllNodes<HTMLAnchorElement>(
                        '[href^="https://l.instagram.com"]',
                        dialogBox
                    );
                multiLinkUrls.forEach((linkElement) => {
                    const linkText = linkElement.innerText;
                    const linkUrl = linkText.includes('\n')
                        ? linkText.split('\n')[1]
                        : linkText; // Assumes URL is always after the newline if present
                    bioLinks.push(linkUrl);
                });

                // Closes the dialog box to clean up UI
                const closeElement = await DOMHelper.findNode<HTMLElement>(
                    '[aria-label="Close"]',
                    dialogBox
                );
                closeElement?.click();
            }
        } else {
            // Handles single bio link scenario directly without opening a dialog
            const singleLinkUrlElement =
                await DOMHelper.findNode<HTMLAnchorElement>(
                    '[href^="https://l.instagram.com"]'
                );
            if (
                singleLinkUrlElement &&
                singleLinkUrlElement.innerText !==
                    'Contact Uploading & Non-Users'
            ) {
                bioLinks.push(singleLinkUrlElement.innerText);
            }
        }
    }

    return bioLinks;
};

const handleMessage = async (message: IMessage) => {
    if (isWorkerMessage(message) && isScriptContextMessage(message)) {
        const { suggester, enableStackTrace } = message.scriptContext;
        const username = getUsernameFromUrl(document.URL);

        await followUser();
        DOMHelper.log({
            methodName: 'followUser',
            message: 'Successfully Followed User',
            severity: 'INFO',
        });

        const suggestedUrls = await getSuggestedProfileUrls();
        const suggestedProfiles = suggestedUrls?.map((url) => ({
            suggester: username,
            url,
        }));

        const profileData: ITabData = {
            user: username,
            url: document.URL,
            fatalErrors: DOMHelper.fatalErrors,
            followerCount: await getFollowerCount(),
            profileImageUrl: await getProfileImageUrl(username),
            bioLinkUrls: await getBioLinkUrls(),
            suggestedProfiles,
            suggester,
        };

        await unfollowUser();
        DOMHelper.log({
            methodName: 'unfollowUser',
            message: 'Successfully UnFollowed User',
            severity: 'INFO',
        });
        await sleep(1000);

        const response: IContentScriptMessage = {
            source: 'ContentScript',
            signal: 'complete',
            tabData: enableStackTrace
                ? { ...profileData, logs: DOMHelper.stackTrace }
                : profileData,
        };
        chrome.runtime.sendMessage(response);
    }
};

chrome.runtime.onMessage.addListener(handleMessage);
