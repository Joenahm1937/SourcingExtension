export const CONTENT_SCRIPT_SIGNAL = {
    COMPLETE: 'complete',
} as const;

export const ContentScriptError = {
    ELEMENT_NOT_FOUND: 'Element Not Found',
    ELEMENTS_NOT_FOUND: 'Elements Not Found',
    ELEMENT_NOT_FOUND_IN_ANCESTRY: 'Element Belonging to Ancestor Not Found',
    NO_ELEMENT_CONTAINING_TEXT: 'No Element Containing Text',
    NO_SINGLE_HIGHEST: 'No Top Level Element Found',
    ELEMENT_NOT_PRESENT_WITHIN_TIME: 'Element Not Present Within Time',
    ELEMENT_CONTAINING_TEXT_NOT_PRESENT_WITHIN_TIME:
        'Element With Text Not Present Within Time',
} as const;
