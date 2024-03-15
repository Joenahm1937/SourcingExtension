const DEFAULT_FINDING_TIMEOUT = 20000;

/**
 * Provides utility functions for DOM manipulations and interactions, with built-in error handling.
 */
export class DOMHelperClass {
    private static instance: DOMHelperClass;
    hasErrored = false;
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

    findNode<T extends Element>(
        queryString: string,
        node: Document | Element = document,
        timeoutMs: number = DEFAULT_FINDING_TIMEOUT
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
                    this.appendErrorStack('findNode', queryString);
                    resolve(null);
                }
            }, 100);
        });
    }

    findNodeByText<T extends Element>(
        text: string,
        node: Document | Element = document,
        timeoutMs: number = DEFAULT_FINDING_TIMEOUT
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
                    this.appendErrorStack('findNodeByText', text);
                    resolve(null);
                }
            }, 100);
        });
    }

    findAllNodes<T extends Element>(
        queryString: string,
        node: Document | Element = document,
        timeoutMs: number = DEFAULT_FINDING_TIMEOUT
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
                    this.appendErrorStack('findAllNodes', queryString);
                    resolve([]);
                }
            }, 100);
        });
    }

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
        this.appendErrorStack('findNodeUpwards', queryString);
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
            this.appendErrorStack('filterElementsByText', pattern.toString());
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
        if (elementList.length === 0) return null;
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
            this.appendErrorStack('findHighestElement', elementList.join(','));
            return null;
        }
        return highestElement;
    };

    private appendErrorStack(methodName: string, identifier: string): void {
        const errorMessage = `${methodName} ${identifier}`;
        if (!this.hasErrored) this.hasErrored = true;
        this.errorStack.push(errorMessage);
    }
}

export const DOMHelper = DOMHelperClass.getInstance();
