import type {
    IScriptContextMessage,
    IProfile,
    IScriptContextData,
} from '../interfaces';
import {
    INSTAGRAM_PROFILE_PAGE_REGEX,
    INVALID_PAGE_ERROR,
    NO_TAB_PERMISSION_ERROR,
} from './constants';
import { IValidatedTab } from './interfaces';

/**
 * A singleton class to manage and control the opening and processing of tabs.
 */
class TabsFacadeClass {
    private static instance: TabsFacadeClass;
    private maxTabs = 5;
    private openTabsCount: number = 0;

    // Should move visited to local storage
    private visited: Set<string> = new Set();
    private queue: IProfile[] = [];
    private enabled: boolean = false;
    private scriptContext: IScriptContextData = {
        enableStackTrace: false,
    };

    /**
     * Returns the singleton instance of the class.
     * @returns {TabsFacadeClass} The singleton instance.
     */
    public static getInstance(): TabsFacadeClass {
        if (!TabsFacadeClass.instance) {
            TabsFacadeClass.instance = new TabsFacadeClass();
        }
        return TabsFacadeClass.instance;
    }

    public updateMaxTabs = (maxTabCount: number): void => {
        this.maxTabs = Math.min(10, Math.max(1, maxTabCount));
    };

    public updateScriptContext(newContext: Partial<IScriptContextData>): void {
        this.scriptContext = {
            ...this.scriptContext,
            ...newContext,
        };
    }

    /**
     * Validates if the extension is running on a valid tab
     * Starts processing the URLs from the current tab or the queue.
     * @param {Function} callback - The callback to execute after processing starts or if an error occurs.
     */
    public startProcessing = (callback: Function) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            try {
                if (this.isValidTab(currentTab)) {
                    this.enabled = true;
                    if (this.queue.length === 0) {
                        const rootProfile: IProfile = {
                            url: currentTab.url,
                        };
                        this.enqueue(rootProfile);
                    }
                    callback();
                    this.processNext();
                }
            } catch (error) {
                callback(error as Error);
            }
        });
    };

    /**
     * Stops the processing of URLs, clears the queue and timeouts.
     * TODO: Close all currently open tabs and only save tabs to local storage if this.enabled
     */
    public stopProcessing = (): void => {
        this.enabled = false;
    };

    public closeTab = (tab: chrome.tabs.Tab) => {
        chrome.tabs.remove(tab.id as number, () => {
            this.openTabsCount--;

            if (
                this.enabled &&
                this.openTabsCount < this.maxTabs &&
                this.queue.length > 0
            ) {
                this.processNext();
            }
        });
    };

    public flushQueue = () => {
        this.queue = [];
    };

    /**
     * Enqueues a single URL or an array of URLs to the processing queue.
     * @param {string | string[]} url - The URL or URLs to add to the queue.
     */
    public enqueue(profiles: IProfile | IProfile[]): void {
        if (Array.isArray(profiles)) {
            const nonVisitedUrls = profiles.filter(
                (profile) => !this.visited.has(profile.url)
            );
            this.queue.push(...nonVisitedUrls);
        } else if (!this.visited.has(profiles.url)) {
            this.queue.push(profiles);
        }
    }

    /**
     * Dequeues URLs from the processing queue based on the available capacity.
     * @returns {string[]} An array of URLs to process next.
     */
    private dequeueAvailable(): IProfile[] {
        const availableTabs = this.maxTabs - this.openTabsCount;
        return this.queue.splice(0, availableTabs);
    }

    /**
     * Processes the next URLs in the queue by opening new tabs if capacity allows.
     */
    private processNext(): void {
        const profilesToProcess = this.dequeueAvailable();
        profilesToProcess.forEach((profile) => {
            this.openTabsCount++;
            chrome.tabs.create({ url: profile.url, active: false }, (tab) => {
                this.visited.add(profile.url);
                if (tab.id) {
                    // Check every 1 second if the tab is ready
                    const checkTabReady = setInterval(() => {
                        chrome.tabs.get(tab.id as number, (updatedTab) => {
                            if (updatedTab.status === 'complete') {
                                clearInterval(checkTabReady);

                                chrome.scripting.executeScript(
                                    {
                                        target: { tabId: tab.id as number },
                                        files: ['contentScript.js'],
                                    },
                                    () => {
                                        const message: IScriptContextMessage = {
                                            source: 'Worker',
                                            signal: 'send_context',
                                            scriptContext: {
                                                ...this.scriptContext,
                                                suggester: profile.suggester,
                                            },
                                        };
                                        chrome.tabs.sendMessage(
                                            tab.id as number,
                                            message
                                        );
                                    }
                                );
                            }
                        });
                    }, 1000);
                }
            });
        });
    }

    /**
     * Validates if a given tab is suitable for processing based on its URL.
     * @param {chrome.tabs.Tab} tab - The tab to validate.
     * @returns {boolean} True if the tab is valid, otherwise throws an error.
     */
    private isValidTab(tab: chrome.tabs.Tab): tab is IValidatedTab {
        if (!tab.url) {
            throw new Error(NO_TAB_PERMISSION_ERROR);
        }
        if (!INSTAGRAM_PROFILE_PAGE_REGEX.test(tab.url)) {
            throw new Error(INVALID_PAGE_ERROR);
        }
        return true;
    }
}

export const TabsFacade = TabsFacadeClass.getInstance();
