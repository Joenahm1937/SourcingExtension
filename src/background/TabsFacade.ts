import { IWorkerMessage } from '../interfaces';
import {
    INSTAGRAM_PROFILE_PAGE_REGEX,
    INVALID_PAGE_ERROR,
    NO_TAB_PERMISSION_ERROR,
} from './constants';

interface IValidatedTab extends chrome.tabs.Tab {
    url: string;
}

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
            console.log(`Processing URL: ${url}`);

            // Simulate mock asynchronous tab processing
            const timeoutId = setTimeout(() => {
                this.openTabsCount--;
                console.log(`Completed processing URL: ${url}`);
                const message: IWorkerMessage = {
                    source: 'Worker',
                    signal: 'refresh',
                    data: url,
                };
                chrome.runtime.sendMessage(message);
                const newUrl1 = `${url}->child1`;
                const newUrl2 = `${url}->child2`;
                this.enqueueUrl([newUrl1, newUrl2]);
                if (this.urlQueue.length > 0 && this.enabled) {
                    this.processNextUrls();
                }
            }, 6000);

            this.currentProcessTimeoutIds.push(timeoutId);
        });

        if (
            this.openTabsCount === 0 &&
            this.urlQueue.length === 0 &&
            this.enabled
        ) {
            this.stopProcessing();
        }
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
