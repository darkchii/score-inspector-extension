import type { ITeam } from "./types/team";

export const MODE_SLUGS_ALT = ["osu", "taiko", "fruits", "mania"];
export const MODE_SLUGS = ["osu", "taiko", "catch", "mania"];
export const MODE_NAMES = ["osu!", "osu!taiko", "osu!catch", "osu!mania"];

export async function WaitForElement(selector: string, timeout: number = 5000) {
    const startTime = new Date().getTime();
    while (document.querySelectorAll(selector).length == 0) {
        if (new Date().getTime() - startTime > timeout) {
            return null;
        }
        await new Promise(r => setTimeout(r, 100));
    }
}

export function searchElementForAttribute(element: HTMLElement, attribute: string): string | null {
    if (element.getAttribute(attribute)) {
        return element.getAttribute(attribute);
    }

    for (let i = 0; i < element.children.length; i++) {
        const child = element.children[i] as HTMLElement;
        if (child.getAttribute(attribute)) {
            return child.getAttribute(attribute);
        }
    }

    return null;
}

const minColorOffset = 100;
export function GetTeamColor(team: ITeam): string {
    if (team.color) {
        //validate that its a #xxxxxx color
        if (/^#([0-9A-F]{3}){1,2}$/i.test(team.color)) {
            return team.color;
        }
    }

    const teamId = team.id;
    const teamName = team.name;
    //create a light-colored color based on "{teamId}-{teamName}-extrasalt"
    const hash = `${teamId}-${teamName}-extrasalt`.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const r = (hash * 123) % (255 - minColorOffset) + minColorOffset; //ensure it's between minColorOffset and 255
    const g = (hash * 321) % (255 - minColorOffset) + minColorOffset;
    const b = (hash * 213) % (255 - minColorOffset) + minColorOffset;
    return `rgb(${r}, ${g}, ${b})`;
}

const defaultNumberFormatter = new Intl.NumberFormat(navigator.language);
export function formatNumber(num: number, precision?: number, options?: Intl.NumberFormatOptions, locale?: string): string | number {
    if (num === null || num === undefined || !num || isNaN(num) || num === Infinity || num === -Infinity) {
        return num;
    }

    if (precision == null && options == null && locale == null) {
        return defaultNumberFormatter.format(num);
    }

    options ??= {};

    if (precision != null) {
        options.minimumFractionDigits = precision;
        options.maximumFractionDigits = precision;
    }

    return num.toLocaleString(locale ?? navigator.language, options);
}

export function getRulesetIconSpan(ruleset_id: number): HTMLSpanElement {
    const ruleset_icon = document.createElement("span");
    ruleset_icon.classList.add("fal", `fa-extra-mode-${MODE_SLUGS_ALT[ruleset_id]}`);
    return ruleset_icon;
}

export function countryCodeToUnicodeHex(countryCode: string): string {
    if (countryCode.length !== 2 || !/^[a-zA-Z]+$/.test(countryCode)) {
        throw new Error("Input must be a 2-letter country code (e.g., 'JP', 'US')");
    }

    const c1 = countryCode.toUpperCase().charCodeAt(0);
    const c2 = countryCode.toUpperCase().charCodeAt(1);

    // Regional Indicator A (🇦) starts at 0x1F1E6 (U+1F1E6)
    const hex1 = (0x1F1E6 + c1 - 'A'.charCodeAt(0)).toString(16);
    const hex2 = (0x1F1E6 + c2 - 'A'.charCodeAt(0)).toString(16);

    return `${hex1}-${hex2}`;
}

export function formatNumberAsSize(number: number): string {
    if (number >= 1e12) {
        return (number / 1e12).toFixed(1) + 'T';
    } else if (number >= 1e9) {
        return (number / 1e9).toFixed(1) + 'B';
    } else if (number >= 1e6) {
        return (number / 1e6).toFixed(1) + 'M';
    } else if (number >= 1e3) {
        return (number / 1e3).toFixed(1) + 'K';
    } else {
        return number.toString();
    }
}