## About

This userscript adds more stats to user profiles on the official osu! websites.
For the foreseeable future, only the standard gamemode is supported, and only for users available on the osu!alt discord (typically top 10k + another 40k players, check the site below for more info)

Also check out https://score.kirino.sh/!

Works on most browsers. You may need to enable "Developer Mode" in extension settings in case Manifest V3 is used (mostly chromium browsers for now).

## What does this extension do
- [ALL] Integrate scores inspector clans into the website (adds tags to usernames, a banner to profile)
- [ALL] Adds a score rank graph to top 10k score rank players
- [STD] Adds global and country SS ranking to the array of other ranks displayed
- [STD] Adds total clears and B/C/D grade counts to profiles
- [STD] Adds completion percentage to profile and score rank leaderboards (in place of Accuracy percentage)
- [ALL] Adds Top 50s amount
- [STD] Custom leaderboards
- [ALL] Per-difficulty backgrounds on beatmap pages, ranked + loved only (using catboy.best api)

*Score rank history started in August 2023 for standard, and in June 2024 for other modes.*

## Installation

To install the Tampermonkey userscript from the provided GitHub link, follow these steps:

1. Make sure you have [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/) extension installed in your browser.
2. Open the provided GitHub link: [score-inspector-extension](https://github.com/darkchii/score-inspector-extension/raw/main/inspector.user.js).
3. Tampermonkey should automatically detect the userscript and open a new tab with the installation prompt.
4. Once installed, the userscript will be active and ready to use.
5. If nothing happens and are using a Chromium browser (Chrome, Edge...), you may need to enable Developer Mode. (Extension Settings > Developer Mode)

*Greasemonkey does not work*

## TODO
- ~~Show clantags everywhere on the site (leaderboards, friends list... etc)~~ (Added in 2024-06-18.x, multiple updates)
- ~~Remember selected rank graph~~ (Added in 2024-06-22.20)
- ~~Global and Country SS ranking~~ (Added in 2024-06-22.20)
- A notification if user has no osu!alt statistics available
- ~~Add completion badges to those who don't have it~~ (Added in 2024-06-16.6)

## Bugs
Things that will be fixed in a future update
- ~~If player default mode is not set to standard, it still loads standard data.~~ (Fixed in 2024-06-15.3)
- ~~Data sometimes not loading when navigating within the site~~ (Fixed in 2024-06-16.5)

Other extensions may break this, or the other way around. Potential issues (and fixes):

- cyperdark's color changer
- - Turn off 'Adjust profile (More compact)'
