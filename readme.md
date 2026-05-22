# ⚠️ NOTE ⚠️

⚠️ This project will soon be archived. The state of scores inspector as of editing this (May 22 2026) will be legacy, as new versions are made and are inherently different in how it works. The extension will be part of the rework.

All network related projects are already disabled, hence why this extension does not function anymore. (I also got IP banned from osu! which should be resolved soon, which pushed me to turning it all off prematurely while rework isn't done yet.)

I'm unsure on how to proceed, whether a userscript suffices again, or a fully fledged browser extension, but this takes no priority to scores inspector 3.

## About

This userscript adds more stats to user profiles on the official osu! websites.
For the foreseeable future, only the standard gamemode is supported, and only for users available on the osu!alt discord (typically top 10k + another 40k players, check the site below for more info)

Also check out https://score.kirino.sh/!

Works on most browsers. You may need to enable "Developer Mode" in extension settings in case Manifest V3 is used (mostly chromium browsers for now).

## What does this extension do
- [ALL] Add team tags to usernames
- [ALL] Adds a score rank graph to top 10k score rank players
- [STD] Adds global and country SS ranking to the array of other ranks displayed
- [STD] Adds total clears and B/C/D grade counts to profiles
- [STD] Adds completion percentage to profile and score rank leaderboards (in place of Accuracy percentage)
- [ALL] Adds Top 50s amount
- [ALL] Show all scores set by the user on the score page (/scores/)
- [ALL] Add extra difficulty information (modded star ratings, aim, speed..) to score page
- [ALL] Calculate PP for unranked/loved maps and PP if FC for all
- [STD] Custom leaderboards

Most changes can be toggled on or off through settings in top-right corner.

*Score rank history started in August 2023 for standard, and in June 2024 for other modes.*

## Installation

To install the Tampermonkey userscript from the provided GitHub link, follow these steps:

1. Make sure you have [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/) extension installed in your browser.
2. Open the provided GitHub link: [score-inspector-extension](https://github.com/darkchii/score-inspector-extension/raw/main/inspector.user.js).
3. Tampermonkey should automatically detect the userscript and open a new tab with the installation prompt.
4. Once installed, the userscript will be active and ready to use.
5. If nothing happens and are using a Chromium browser (Chrome, Edge...), you may need to enable Developer Mode. (Extension Settings > Developer Mode)

*Greasemonkey does not work*
