## About

This userscript adds more stats to user profiles on the official osu! websites.

For the foreseeable future, only the standard gamemode is supported, and only for users available on the osu!alt discord (typically top 10k + another 40k players, check the site below for more info)

Also check out https://score.kirino.sh/!

## Installation

To install the Tampermonkey userscript from the provided GitHub link, follow these steps:

1. Make sure you have [Tampermonkey](https://www.tampermonkey.net/) installed in your browser. If not, you can download and install it from the official Tampermonkey website.

2. Open the provided GitHub link: [score-inspector-extension](https://github.com/darkchii/score-inspector-extension/raw/main/inspector.user.js).

3. Tampermonkey should automatically detect the userscript and open a new tab with the installation prompt.

4. Once installed, the userscript will be active and ready to use.

## TODO
- Show clantags everywhere on the site (leaderboards, friends list... etc)
- Remember selected rank graph
- A notification if user has no osu!alt statistics available

## Bugs
Things that will be fixed in a future update
- ~~If player default mode is not set to standard, it still loads standard data.~~ (Fixed in 2024-06-15.3)
- Data sometimes not loading when navigating within the site

Other extensions may break this, or the other way around. Potential issues (and fixes):

- cyperdark's color changer
- - Turn off 'Adjust profile (More compact)'
