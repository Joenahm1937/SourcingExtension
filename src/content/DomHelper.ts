import type { ErrorType } from './interfaces';
import { ContentScriptError } from './constants';

/**
 * Provides utility functions for DOM manipulations and interactions, with built-in error handling.
 */
export class DOMHelperClass {
    private static instance: DOMHelperClass;
    hasErrored = false;
    errorType: ErrorType = null;

    /**
     * Returns the singleton instance of the class.
     * @returns {DOMHelperClass} The singleton instance.
     */
    public static getInstance(): DOMHelperClass {
        if (!DOMHelperClass.instance) {
            DOMHelperClass.instance = new DOMHelperClass();
        }
        return DOMHelperClass.instance;
    }

    /**
     * Finds a single DOM node matching the specified query string.
     * Allows specifying the expected return type.
     * @param queryString - A DOMString containing one or more selectors to match.
     * @returns The first Element within the document that matches the specified selector, or null if no matches are found.
     */
    findNode<T extends Element>(
        queryString: string,
        node: Document | Element = document
    ): T | null {
        if (this.hasErrored) return null;
        const element = node.querySelector(queryString);
        // Assuming callers are responsible for ensuring the type safety post-query.
        // Type assertion is necessary as TypeScript cannot infer the correct type.
        if (element) {
            return element as T;
        }
        this.hasErrored = true;
        this.errorType = ContentScriptError.ELEMENT_NOT_FOUND;
        return null;
    }

    /**
     * Finds all DOM nodes matching the specified query string.
     * Allows specifying the expected return type.
     * @param queryString - A DOMString containing one or more selectors to match.
     * @returns An array of all Elements within the document that match the specified selector, or an empty array if no matches are found.
     */
    findAllNodes<T extends Element>(
        queryString: string,
        node: Document | Element = document
    ): T[] {
        if (this.hasErrored) return [];
        const elements = node.querySelectorAll(queryString);
        if (elements.length === 0) {
            this.hasErrored = true;
            this.errorType = ContentScriptError.ELEMENTS_NOT_FOUND;
            return [];
        }
        // Type assertion is necessary as TypeScript cannot infer the correct type inside the array.
        return Array.from(elements) as T[];
    }

    /**
     * Filters elements by text content, using a string or RegExp pattern.
     * @param pattern - The text or pattern to match the element's text content against.
     * @param elementList - An array of HTMLElements to filter.
     * @returns An array of HTMLElements that match the specified text or pattern.
     */
    filterElementsByText = (
        pattern: string | RegExp,
        elementList: HTMLElement[]
    ): HTMLElement[] => {
        if (this.hasErrored) return [];
        const isRegex = pattern instanceof RegExp;
        const filteredElements = elementList.filter((element) => {
            return isRegex
                ? pattern.test(element.innerText)
                : element.innerText === pattern;
        });
        if (filteredElements.length === 0) {
            this.hasErrored = true;
            this.errorType = ContentScriptError.NO_ELEMENT_CONTAINING_TEXT;
            return [];
        }
        return filteredElements;
    };

    /**
     * Identifies the highest element in the DOM from a list of elements.
     * @param elementList - An array of HTMLElements to evaluate.
     * @returns The highest HTMLElement in the DOM, or null if no unique highest element is found.
     */
    findHighestElement = (elementList: HTMLElement[]): HTMLElement | null => {
        if (this.hasErrored) return null;
        let noSingleHighest = false;
        const highestElement = elementList.reduce((highest, current) => {
            const position = highest.compareDocumentPosition(current);
            if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
                noSingleHighest = false;
                return current;
            } else if (position & Node.DOCUMENT_POSITION_PRECEDING) {
                return highest;
            } else {
                noSingleHighest = true;
                return highest;
            }
        });
        if (noSingleHighest) {
            this.hasErrored = true;
            this.errorType = ContentScriptError.NO_SINGLE_HIGHEST;
            return null;
        }
        return highestElement;
    };

    /**
     * Waits for an element to be present in the DOM within a specified timeout period.
     * @param {string} queryString - The query selector to wait for.
     * @param {number} timeoutSeconds - The maximum time to wait for the element, in milliseconds.
     * @returns {Promise<Element | null>} A promise that resolves to the element if found within the timeout period, or null if not found or an error occurred.
     */
    waitUntilElementPresent = (
        queryString: string,
        timeoutSeconds: number,
        node: Document | Element = document
    ): Promise<Element | null> => {
        if (this.hasErrored) return Promise.resolve(null);
        return new Promise((resolve) => {
            const startTime = Date.now();
            const interval = setInterval(() => {
                const element = node.querySelector(queryString);
                if (element) {
                    clearInterval(interval);
                    resolve(element);
                } else if (Date.now() - startTime > timeoutSeconds) {
                    clearInterval(interval);
                    this.hasErrored = true;
                    this.errorType =
                        ContentScriptError.ELEMENT_NOT_PRESENT_WITHIN_TIME;
                    resolve(null);
                }
            }, 100);
        });
    };
}

export const DOMHelper = DOMHelperClass.getInstance();
