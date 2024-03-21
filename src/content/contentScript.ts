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
const findTopLevelButton = async (
    buttonText: string
): Promise<HTMLButtonElement | null> => {
    const buttons = await DOMHelper.findAllNodes<HTMLButtonElement>('button');
    const targetButtons = DOMHelper.filterElementsByText<HTMLButtonElement>(
        buttonText,
        buttons
    );
    const highestButton = DOMHelper.findHighestElement(targetButtons);
    return highestButton;
};

// Follows the user
const followUser = async (): Promise<void> => {
    const followButton = await findTopLevelButton(BUTTON_TEXTS.follow);
    if (followButton) {
        followButton.click();
        DOMHelper.log({
            methodName: 'followUser',
            message: 'Successfully Followed User',
            severity: 'INFO',
        });
    } else {
        DOMHelper.log({
            methodName: 'followUser',
            message: 'Could Not Find Main Follow Button',
            severity: 'ERROR',
        });
    }
};

// Unfollows the user
const unfollowUser = async (): Promise<void> => {
    const followingButton = await findTopLevelButton(BUTTON_TEXTS.following);
    if (followingButton) {
        followingButton.click();
        DOMHelper.log({
            methodName: 'unfollowUser',
            message: 'Successfully Found Main Following Button',
            severity: 'INFO',
        });
        const dialogBox = await DOMHelper.findNode('[role="dialog"]');
        if (dialogBox) {
            DOMHelper.log({
                methodName: 'unfollowUser',
                message: 'Successfully Found Dialog Box',
                severity: 'INFO',
            });
            const unfollowTextNode = await DOMHelper.findNodeByText(
                BUTTON_TEXTS.unfollow,
                dialogBox
            );
            if (unfollowTextNode) {
                DOMHelper.log({
                    methodName: 'unfollowUser',
                    message: `Successfully Found DOM node with text ${BUTTON_TEXTS.unfollow} within Dialog Box`,
                    severity: 'INFO',
                });
            } else {
                DOMHelper.log({
                    methodName: 'unfollowUser',
                    message: `Could Not Find DOM node with text ${BUTTON_TEXTS.unfollow} within Dialog Box`,
                    severity: 'FATAL',
                });
            }
            const unFollowButton = DOMHelper.filterElementsByText(
                BUTTON_TEXTS.unfollow,
                await DOMHelper.findAllNodes<HTMLElement>(
                    '[role="button"]',
                    dialogBox
                )
            )[0];
            if (unFollowButton) {
                unFollowButton.click();
                DOMHelper.log({
                    methodName: 'unfollowUser',
                    message: `Successfully Unfollowed User`,
                    severity: 'INFO',
                });
            } else {
                DOMHelper.log({
                    methodName: 'unfollowUser',
                    message: `Could Not Find Main Unfollow Button within Dialog Box`,
                    severity: 'FATAL',
                });
            }
        } else {
            DOMHelper.log({
                methodName: 'unfollowUser',
                message: 'Could Not Find Dialog Box',
                severity: 'FATAL',
            });
        }
    } else {
        DOMHelper.log({
            methodName: 'unfollowUser',
            message: 'Could Not Find Main Following Button',
            severity: 'FATAL',
        });
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
            DOMHelper.log({
                methodName: 'getSuggestedProfileUrls',
                message: 'Successfully fetched suggested profile URLs',
                severity: 'INFO',
            });
            return Array.from(uniqueLinks);
        }
    }
    // This is an INFO log because some Instagram accounts do not have profile suggestions
    DOMHelper.log({
        methodName: 'getSuggestedProfileUrls',
        message: 'No Profile Suggestions for this Profile',
        severity: 'INFO',
    });
};

// Retrieves the profile image URL
const getProfileImageUrl = async (
    username: string
): Promise<string | undefined> => {
    const imageElement = await DOMHelper.findNode<HTMLImageElement>(
        `[alt$="${username}'s profile picture"]`
    );
    if (imageElement) {
        DOMHelper.log({
            methodName: 'getProfileImageUrl',
            message: `Successfully fetched profile image URL for ${username}`,
            severity: 'INFO',
        });
        return imageElement.src;
    }
    DOMHelper.log({
        methodName: 'getProfileImageUrl',
        message: `Failed to fetch profile image URL for ${username}`,
        severity: 'ERROR',
    });
};

// Obtains follower count
const getFollowerCount = async (): Promise<string | undefined> => {
    const followerCountElement = await DOMHelper.findNode<HTMLElement>(
        '[href$="followers/"]'
    );
    if (followerCountElement) {
        DOMHelper.log({
            methodName: 'getFollowerCount',
            message: 'Successfully fetched follower count',
            severity: 'INFO',
        });
        return followerCountElement.innerText;
    }
    DOMHelper.log({
        methodName: 'getFollowerCount',
        message: 'Failed to fetch follower count',
        severity: 'ERROR',
    });
};

// Extracts bio link URLs
const getBioLinkUrls = async (): Promise<string[]> => {
    const bioLinks: string[] = [];
    const linkSVG = await DOMHelper.findNode('[aria-label="Link icon"]');

    if (linkSVG) {
        DOMHelper.log({
            methodName: 'getBioLinkUrls',
            message: 'Found Link Icon',
            severity: 'INFO',
        });
        const openLinkDialogBoxButton = linkSVG.closest('button');
        if (openLinkDialogBoxButton) {
            openLinkDialogBoxButton.click();
            DOMHelper.log({
                methodName: 'getBioLinkUrls',
                message: 'Clicked Multi-Link Button to Open Dialog Box',
                severity: 'INFO',
            });

            // Waits for the dialog box to appear after click event
            const dialogBox = await DOMHelper.findNode('[role="dialog"]');
            if (dialogBox) {
                DOMHelper.log({
                    methodName: 'getBioLinkUrls',
                    message: 'Found Multi-Link Dialog Box',
                    severity: 'INFO',
                });
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

                DOMHelper.log({
                    methodName: 'getBioLinkUrls',
                    message: `Extracted ${bioLinks.length} Bio Links from Multi-Link Dialog`,
                    severity: 'INFO',
                });

                const closeElement = await DOMHelper.findNode<HTMLElement>(
                    '[aria-label="Close"]',
                    dialogBox
                );
                if (closeElement) {
                    closeElement.click();
                    DOMHelper.log({
                        methodName: 'getBioLinkUrls',
                        message: 'Closed Multi-Link Dialog Box',
                        severity: 'INFO',
                    });
                } else {
                    DOMHelper.log({
                        methodName: 'getBioLinkUrls',
                        message:
                            'Could Not Find Close Button for Multi-Link Dialog Box',
                        severity: 'ERROR',
                    });
                }
            } else {
                DOMHelper.log({
                    methodName: 'getBioLinkUrls',
                    message:
                        'Could Not Find Multi-Link Dialog Box After Clicking',
                    severity: 'ERROR',
                });
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
                DOMHelper.log({
                    methodName: 'getBioLinkUrls',
                    message: 'Extracted Single Bio Link',
                    severity: 'INFO',
                });
            } else {
                DOMHelper.log({
                    methodName: 'getBioLinkUrls',
                    message: 'Failed to identify Single Bio Link',
                    severity: 'ERROR',
                });
            }
        }
    } else {
        // This is an INFO log because some Instagram accounts do not have links in bio
        DOMHelper.log({
            methodName: 'getBioLinkUrls',
            message: 'No Link Icon Found in Bio',
            severity: 'INFO',
        });
    }

    return bioLinks;
};

const handleMessage = async (message: IMessage) => {
    if (isWorkerMessage(message) && isScriptContextMessage(message)) {
        const { suggester, enableStackTrace } = message.scriptContext;
        const username = getUsernameFromUrl(document.URL);

        await followUser();

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
