import type { ILog } from '../interfaces';

const DEFAULT_FINDING_TIMEOUT = 3000;

/**
 * Provides utility functions for DOM manipulations and interactions, with built-in error handling.
 */
export class DOMHelperClass {
    private static instance: DOMHelperClass;
    loggingEnabled = true;
    stackTrace: ILog[] = [];
    fatalErrors: ILog[] = [];

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
                    this.log({
                        methodName: this.findNode.name,
                        severity: 'DEBUG',
                        message: `Found node with queryString ${queryString}`,
                    });
                    resolve(element as T);
                } else if (Date.now() - startTime > timeoutMs) {
                    clearInterval(interval);
                    this.log({
                        methodName: this.findNode.name,
                        severity: 'WARN',
                        message: `Failed to find node with queryString ${queryString}`,
                    });
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
                for (let element of elements) {
                    if (
                        element.textContent
                            ?.toUpperCase()
                            .includes(text.toUpperCase())
                    ) {
                        clearInterval(interval);
                        this.log({
                            methodName: this.findNodeByText.name,
                            severity: 'DEBUG',
                            message: `Found node with text ${text}`,
                        });
                        resolve(element as T);
                        return;
                    }
                }
                if (Date.now() - startTime > timeoutMs) {
                    clearInterval(interval);
                    this.log({
                        methodName: this.findNodeByText.name,
                        severity: 'WARN',
                        message: `Failed to find node with text ${text}`,
                    });
                    resolve(null);
                }
            }, 100);
        });
    }

    findAllNodes<T extends Element>(
        queryString: string,
        node: Document | Element = document,
        timeoutMs: number = DEFAULT_FINDING_TIMEOUT
    ): Promise<T[]> {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const interval = setInterval(() => {
                const elements = node.querySelectorAll(queryString);
                if (elements.length !== 0) {
                    clearInterval(interval);
                    this.log({
                        methodName: this.findAllNodes.name,
                        severity: 'DEBUG',
                        message: `Found nodes with queryString ${queryString}`,
                    });
                    resolve(Array.from(elements) as T[]);
                } else if (Date.now() - startTime > timeoutMs) {
                    clearInterval(interval);
                    this.log({
                        methodName: this.findAllNodes.name,
                        severity: 'WARN',
                        message: `Failed to nodes with queryString ${queryString}`,
                    });
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
            if (foundNode) {
                this.log({
                    methodName: this.findNodeUpwards.name,
                    severity: 'DEBUG',
                    message: `Found node upwards from ${startNode.outerHTML.substring(
                        0,
                        30
                    )} with queryString ${queryString}`,
                });
                return foundNode;
            }
            currentNode = currentNode.parentElement;
        }
        this.log({
            methodName: this.findNodeUpwards.name,
            severity: 'WARN',
            message: `No matching node upwards from ${startNode.outerHTML.substring(
                0,
                30
            )} with queryString ${queryString}`,
        });
        return null;
    }

    /**
     * Filters elements by text content, using a string or RegExp pattern.
     * @param pattern - The text or pattern to match the element's text content against.
     * @param elementList - An array of HTMLElements to filter.
     * @returns An array of HTMLElements that match the specified text or pattern.
     */
    filterElementsByText<T extends HTMLElement>(
        pattern: string | RegExp,
        elementList: T[]
    ): T[] {
        const isRegex = pattern instanceof RegExp;
        const filteredElements = elementList.filter((element) => {
            return isRegex
                ? pattern.test(element.innerText)
                : element.innerText.toUpperCase() === pattern;
        });
        if (filteredElements.length === 0) {
            this.log({
                methodName: this.filterElementsByText.name,
                severity: 'WARN',
                message: `No element found with text/pattern ${pattern}`,
            });
            return [];
        }
        this.log({
            methodName: this.filterElementsByText.name,
            severity: 'DEBUG',
            message: `Found element with text/pattern ${pattern}`,
        });
        return filteredElements;
    }

    /**
     * Identifies the highest element in the DOM from a list of elements.
     * @param elementList - An array of HTMLElements to evaluate.
     * @returns The highest HTMLElement in the DOM, or null if no unique highest element is found.
     */
    findHighestElement<T extends HTMLElement>(elementList: T[]): T | null {
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
            this.log({
                methodName: this.findHighestElement.name,
                severity: 'WARN',
                message: `No highest level element identified in the specified elementList`,
            });
            return null;
        }
        this.log({
            methodName: this.findHighestElement.name,
            severity: 'DEBUG',
            message: `Highest level element found: ${highestElement.outerHTML.substring(
                0,
                30
            )}`,
        });
        return highestElement;
    }

    log(logEntry: ILog): void {
        const isFatal = logEntry.severity === 'FATAL';

        if (isFatal) {
            this.fatalErrors.push(logEntry);
        }

        if (this.loggingEnabled) {
            this.stackTrace.push(logEntry);
        }
    }
}

export const DOMHelper = DOMHelperClass.getInstance();
