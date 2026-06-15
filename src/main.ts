import { runBeatmapPage } from "./beatmappage";
import { getValue } from "./gm_api";
import { runLeaderboards } from "./leaderboardpage";
import { runScoreRankChanges } from "./scorelbpage";
import { runScorePage } from "./scorepage";
import { createSettings } from "./settings";
import { runTeams } from "./teams";
import { runUserPage } from "./userpage";

async function start() {
    //create turbo listeners
    await run("start");
    document.addEventListener("turbo:load", () => run("turbo:load"));

    if (window.onurlchange === null) {
        console.log("[inspector] registering URL change observer");
        window.addEventListener('urlchange', function (e) {
            run("urlchange");
        });
    }
}

let IS_RUNNER_ACTIVE: boolean = false;
async function run(trigger: string) {
    if (IS_RUNNER_ACTIVE) {
        console.log("Runner is already active, skipping run. Trigger: ", trigger);
        return;
    };
    IS_RUNNER_ACTIVE = true;

    try {
        createSettings();

        await runUserPage();
        await runScorePage();
        await runBeatmapPage();

        if (getValue("teams_show_team_tags", true)) {
            await runTeams();
        }

        if (window.location.href.includes("/rankings/") ||
            window.location.href.includes("/multiplayer/rooms/") ||
            window.location.href.includes("/seasons/")) {
            await runLeaderboards(); //Run this BEFORE score rank stuff etc, since those check for added columns and index offsets
        }

        if (getValue("leaderboards_show_score_changes", true)) {
            await runScoreRankChanges();
        }
    } catch (error) {
        console.error("Error in runner: ", error);
    } finally {
        IS_RUNNER_ACTIVE = false;
    }
}

start();