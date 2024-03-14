import { ContentScriptError } from './constants';

/**
 * Provides utility functions for DOM manipulations and interactions, with built-in error handling.
 */
export class DOMHelperClass {
    private static instance: DOMHelperClass;
    hasErrored = false;
    errorRootCause: string | null = null;
    errorStack: string[] = [];

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
        const element = node.querySelector(queryString);
        // Assuming callers are responsible for ensuring the type safety post-query.
        // Type assertion is necessary as TypeScript cannot infer the correct type.
        if (element) {
            return element as T;
        }
        this.setErrorRootCause(
            'findNode',
            ContentScriptError.ELEMENT_NOT_FOUND,
            queryString
        );
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
        const elements = node.querySelectorAll(queryString);
        if (elements.length === 0) {
            this.setErrorRootCause(
                'findAllNodes',
                ContentScriptError.ELEMENTS_NOT_FOUND,
                queryString
            );
            return [];
        }
        // Type assertion is necessary as TypeScript cannot infer the correct type inside the array.
        return Array.from(elements) as T[];
    }

    /**
     * Traverses up the DOM tree from a given node, attempting to find a node that matches the specified query string.
     * If no matching node is found in the current node's ancestors, null is returned.
     * @param queryString - A DOMString containing one or more selectors to match against.
     * @param startNode - The node from which to start the search, moving up the DOM tree.
     * @returns The first Element that matches the specified selector or null if no matches are found.
     */
    findNodeUpwards<T extends Element>(
        queryString: string,
        startNode: Element
    ): T | null {
        let currentNode: Element | null = startNode;
        while (currentNode) {
            const foundNode = currentNode.querySelector<T>(queryString);
            if (foundNode) return foundNode;
            currentNode = currentNode.parentElement;
        }
        // If no matching node is found after traversing up the DOM tree
        this.setErrorRootCause(
            'findNodeUpwards',
            ContentScriptError.ELEMENT_NOT_FOUND_IN_ANCESTRY,
            queryString
        );
        return null;
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
        const isRegex = pattern instanceof RegExp;
        const filteredElements = elementList.filter((element) => {
            return isRegex
                ? pattern.test(element.innerText)
                : element.innerText.toUpperCase() === pattern;
        });
        if (filteredElements.length === 0) {
            this.setErrorRootCause(
                'filterElementsByText',
                ContentScriptError.NO_ELEMENT_CONTAINING_TEXT,
                pattern.toString()
            );
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
            this.setErrorRootCause(
                'findHighestElement',
                ContentScriptError.NO_SINGLE_HIGHEST,
                elementList.join(',')
            );
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
    waitUntilElementPresent<T extends Element>(
        queryString: string,
        timeoutMs: number,
        node: Document | Element = document
    ): Promise<T | null> {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const interval = setInterval(() => {
                const element = node.querySelector(queryString);
                if (element) {
                    clearInterval(interval);
                    resolve(element as T);
                } else if (Date.now() - startTime > timeoutMs) {
                    clearInterval(interval);
                    this.setErrorRootCause(
                        'waitUntilElementPresent',
                        ContentScriptError.ELEMENT_NOT_PRESENT_WITHIN_TIME,
                        queryString
                    );
                    resolve(null);
                }
            }, 100);
        });
    }

    /**
     * Waits for an element containing specified text to be present in the DOM within a specified timeout period.
     * @param text - The text to wait for within elements.
     * @param timeoutMs - The maximum time to wait for the element, in milliseconds.
     * @param node - The root node to start the search from. Defaults to the document.
     * @returns A promise that resolves to the HTMLElement containing the specified text if found within the timeout period, or null if not found or an error occurred.
     */
    waitUntilElementContainingTextPresent<T extends HTMLElement>(
        text: string,
        timeoutMs: number,
        node: Document | Element = document
    ): Promise<T | null> {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const interval = setInterval(() => {
                const elements = node.getElementsByTagName('*');
                for (let i = 0; i < elements.length; i++) {
                    if (elements[i].textContent?.toUpperCase().includes(text)) {
                        clearInterval(interval);
                        resolve(elements[i] as T);
                        return;
                    }
                }
                if (Date.now() - startTime > timeoutMs) {
                    clearInterval(interval);
                    this.setErrorRootCause(
                        'waitUntilElementContainingTextPresent',
                        ContentScriptError.ELEMENT_CONTAINING_TEXT_NOT_PRESENT_WITHIN_TIME,
                        text
                    );
                    resolve(null);
                }
            }, 100);
        });
    }

    /**
     * Waits for at least one element to be present in the DOM matching a given query string within a specified timeout period.
     * @param {string} queryString - The query selector to wait for.
     * @param {number} timeoutSeconds - The maximum time to wait for the element, in milliseconds.
     * @returns {Promise<Element[] | null>} A promise that resolves to the elements found when a match is found within the timeout period, or an empty array if no matches are found.
     */
    waitUntilSingleMatchPresent<T extends Element>(
        queryString: string,
        timeoutMs: number,
        node: Document | Element = document
    ): Promise<T[] | []> {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const interval = setInterval(() => {
                const elements = node.querySelectorAll(queryString);
                if (elements.length !== 0) {
                    clearInterval(interval);
                    resolve(Array.from(elements) as T[]);
                } else if (Date.now() - startTime > timeoutMs) {
                    clearInterval(interval);
                    this.setErrorRootCause(
                        'waitUntilSingleMatchPresent',
                        ContentScriptError.ELEMENT_NOT_PRESENT_WITHIN_TIME,
                        queryString
                    );
                    resolve([]);
                }
            }, 100);
        });
    }

    /**
     * Logs an error message with the method name, ContentScriptError, and queryString.
     * @param methodName - The name of the method logging the error.
     * @param error - The ContentScriptError to log.
     * @param identifier - The identifier involved in the error.
     */
    private setErrorRootCause(
        methodName: string,
        error: (typeof ContentScriptError)[keyof typeof ContentScriptError],
        identifier: string
    ): void {
        const errorMessage = `ERROR: ${methodName}(): ${identifier} ${error}`;
        if (!this.hasErrored) {
            this.errorRootCause = errorMessage;
            this.hasErrored = true;
        }
        this.errorStack.push(errorMessage);
    }
}

export const DOMHelper = DOMHelperClass.getInstance();
