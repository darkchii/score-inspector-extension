import { getValue } from "./gm_api";
import { MODE_SLUGS_ALT } from "./helpers";
import { OFFICIAL_LEADERBOARD_STRUCTURES } from "./leaderboards";

export async function runLeaderboards() {
    //check if we are on any of the rankings pages in CUSTOM_RANKINGS
    //remove the query string from the url
    let url = window.location.href.split("?")[0]!;
    //remove the domain from the url
    url = url.replace("https://osu.ppy.sh", "");

    let mode = 'osu';
    let ranking = null;
    let is_global = url.includes("/global");
    // /rankings/osu/...
    let mode_index = 2;
    let ranking_index = is_global ? 4 : 3;
    // /rankings/taiko/... we need to get the mode from the url
    if (url.includes("/rankings/")) {
        mode = url.split("/")[mode_index] as any;
        if (!MODE_SLUGS_ALT.includes(mode)) {
            mode = 'osu';
            ranking_index = mode_index;
        }

    } else if (url.includes("/multiplayer/rooms/")) {
        ranking_index = 1;
    } else if (url.includes("/seasons/")) {
        ranking_index = 1;
    }
    ranking = url.split("/")[ranking_index];
    console.log(ranking);
    if (ranking) {
        //doing nothing for now, but the base is here to manipulate leaderboards (besides score changes)
    }
}
