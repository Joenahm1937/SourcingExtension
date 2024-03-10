export const CONTENT_SCRIPT_SIGNAL = {
    COMPLETE: 'complete',
} as const;

export const ContentScriptError = {
    ELEMENT_NOT_FOUND: '[findNode()] Element Not Found',
    ELEMENTS_NOT_FOUND: '[findAllNodes()] Elements Not Found',
    ELEMENT_NOT_FOUND_IN_ANCESTRY:
        '[findNodeUpwards()] Element Belonging to Ancestor Not Found',
    NO_ELEMENT_CONTAINING_TEXT:
        '[filterElementsByText()] No Element Containing Text',
    NO_SINGLE_HIGHEST: '[findHighestElement()] No Top Level Element Found',
    ELEMENT_NOT_PRESENT_WITHIN_TIME:
        '[waitUntilElementPresent()] Element Not Present Within Time',
    ELEMENT_CONTAINING_TEXT_NOT_PRESENT_WITHIN_TIME:
        '[waitUntilElementContainingTextPresent()] Element With Text Not Present Within Time',
} as const;
