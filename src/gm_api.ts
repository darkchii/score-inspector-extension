import { GM_addStyle, GM_getValue, GM_setValue } from 'vite-plugin-monkey/dist/client';

export function addStyle(css: string) {
    GM_addStyle(css);
}

export function getValue<T>(key: string, defaultValue?: T): T {
    return GM_getValue(key, defaultValue);
}

export function setValue<T>(key: string, value: T): void {
    GM_setValue(key, value);
}