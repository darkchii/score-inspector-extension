import type { IMod, IRulesetModData } from "./types/mods";

let MODS_DATA: Record<string, IMod[]> | null = null;
export async function modsDataMakeSure(): Promise<Record<string, IMod[]> | null> {
    if (MODS_DATA) return MODS_DATA;
    const response = await fetch("https://raw.githubusercontent.com/ppy/osu-web/refs/heads/master/database/mods.json");
    if (response.status === 200) {
        let temp_data = await response.json();
        MODS_DATA = {};
        for (const mod_set of temp_data) {
            let ruleset = mod_set.Name;
            MODS_DATA[ruleset] = mod_set.Mods;
        }
        console.log("Fetched mods data: ", MODS_DATA);
        return MODS_DATA;
    } else {
        console.error("Error fetching mods data", response.status, response.statusText);
        return null;
    }
}

export function getModData(): Record<string, IMod[]> | null {
    return MODS_DATA;
}
