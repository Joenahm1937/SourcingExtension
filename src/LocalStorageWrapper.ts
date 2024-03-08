import type { LocalStorageKeys, ILocalStorage } from './interfaces';

export const LocalStorageWrapper = {
    async set<T extends LocalStorageKeys>(
        key: T,
        value: ILocalStorage[T]
    ): Promise<void> {
        await chrome.storage.local.set({ [key]: value });
    },

    async get<T extends LocalStorageKeys>(
        key: T
    ): Promise<ILocalStorage[T] | undefined> {
        const result = await chrome.storage.local.get(key);
        return result[key];
    },

    async remove(key: LocalStorageKeys): Promise<void> {
        await chrome.storage.local.remove(key);
    },

    async clear(): Promise<void> {
        await chrome.storage.local.clear();
    },
};
