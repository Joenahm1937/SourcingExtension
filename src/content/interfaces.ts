import { ContentScriptError } from './constants';

export type ContentScriptErrors = keyof typeof ContentScriptError;
export type ErrorType = (typeof ContentScriptError)[ContentScriptErrors] | null;
