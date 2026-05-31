import { createSettings } from "./settings";

console.log("userscript loaded");
console.log("GM object:", typeof GM);
console.log("GM_addStyle:", typeof GM_addStyle);

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
        console.log("Runner executed successfully. Trigger: ", trigger);
    }catch (error) {
        console.error("Error in runner: ", error);
    } finally {
        IS_RUNNER_ACTIVE = false;
    }
}

start();