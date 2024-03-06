import { IWorkerMessage } from '../interfaces';
import {
    INSTAGRAM_PROFILE_PAGE_REGEX,
    INVALID_PAGE_ERROR,
    NO_TAB_PERMISSION_ERROR,
} from './constants';
import { IValidatedTab } from './interfaces';

const MOCK_SUGGESTED_PROFILE_URLS = Array(5).fill(
    'https://www.instagram.com/joenahm/'
);

/**
 * A singleton class to manage and control the opening and processing of tabs.
 */
class TabsFacadeClass {
    private readonly maxTabs = 3;
    private static instance: TabsFacadeClass;

    private openTabsCount: number = 0;
    private urlQueue: string[] = [];
    private enabled: boolean = false;
    private currentProcessTimeoutIds: number[] = [];

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

    /**
     * Starts processing the URLs from the current tab or the queue.
     * @param {Function} callback - The callback to execute after processing starts or if an error occurs.
     */
    public startProcessing = (callback: Function) => {
        this.enabled = true;
        if (this.urlQueue.length === 0) {
            this.processCurrentTab(callback);
        } else {
            this.processNextUrls();
        }
    };

    /**
     * Stops the processing of URLs, clears the queue and timeouts.
     */
    public stopProcessing(): void {
        console.log('Stopping Processing');
        this.enabled = false;
        this.currentProcessTimeoutIds.forEach((id) => clearTimeout(id));
        this.currentProcessTimeoutIds = [];
        this.openTabsCount = 0;
    }

    /**
     * Processes the currently active tab by validating its URL and then proceeding to process the next URLs in the queue.
     * @param {Function} callback - The callback to execute after the current tab is processed or if an error occurs.
     */
    private processCurrentTab = (callback: Function): void => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            try {
                if (this.isValidTab(currentTab)) {
                    this.enqueueUrl(currentTab.url);
                }
                this.processNextUrls();
                callback();
            } catch (error) {
                callback(error as Error);
            }
        });
    };

    /**
     * Enqueues a single URL or an array of URLs to the processing queue.
     * @param {string | string[]} url - The URL or URLs to add to the queue.
     */
    private enqueueUrl(url: string | string[]): void {
        if (Array.isArray(url)) {
            this.urlQueue.push(...url);
        } else {
            this.urlQueue.push(url);
        }
    }

    /**
     * Dequeues URLs from the processing queue based on the available capacity.
     * @returns {string[]} An array of URLs to process next.
     */
    private dequeueFreeUrls(): string[] {
        const availableTabs = this.maxTabs - this.openTabsCount;
        return this.urlQueue.splice(0, availableTabs);
    }

    /**
     * Processes the next URLs in the queue by opening new tabs if capacity allows.
     */
    private processNextUrls(): void {
        const urlsToProcess = this.dequeueFreeUrls();
        urlsToProcess.forEach((url) => {
            this.openTabsCount++;
            chrome.tabs.create({ url: url, active: false }, (tab) => {
                if (tab.id) {
                    // Check every 1 second if the tab is ready
                    const checkTabReady = setInterval(() => {
                        chrome.tabs.get(tab.id as number, (updatedTab) => {
                            if (updatedTab.status === 'complete') {
                                clearInterval(checkTabReady);

                                // Injecting Content Script
                                // chrome.scripting.executeScript(
                                //     {
                                //         target: { tabId: tab.id as number },
                                //         files: ['contentScript.js'],
                                //     },
                                //     () => {
                                //         // Handle completion of the script execution
                                //     }
                                // );

                                // This will be replaced by signal from content script that it has finished executing
                                setTimeout(() => {
                                    chrome.tabs.remove(tab.id as number);
                                    this.openTabsCount--;
                                    const message: IWorkerMessage = {
                                        source: 'Worker',
                                        signal: 'refresh',
                                        data: url,
                                    };
                                    chrome.runtime.sendMessage(message);
                                    this.enqueueUrl(
                                        MOCK_SUGGESTED_PROFILE_URLS
                                    );

                                    if (
                                        this.urlQueue.length > 0 &&
                                        this.enabled &&
                                        this.openTabsCount <= this.maxTabs
                                    ) {
                                        this.processNextUrls();
                                    }
                                }, 4000);
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
        } else if (!INSTAGRAM_PROFILE_PAGE_REGEX.test(tab.url)) {
            throw new Error(INVALID_PAGE_ERROR);
        }
        return true;
    }
}

export const TabsFacade = TabsFacadeClass.getInstance();
