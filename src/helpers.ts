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