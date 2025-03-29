// ==UserScript==
// @name         osu! scores inspector
// @namespace    https://score.kirino.sh
// @version      2025-03-05.60
// @description  Display osu!alt and scores inspector data on osu! website
// @author       Amayakase
// @match        https://osu.ppy.sh/*
// @icon         https://raw.githubusercontent.com/darkchii/score-inspector-extension/main/icon48.png
// @noframes
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        window.onurlchange
// @require      https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js
// @require      https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0
// @downloadURL  https://github.com/darkchii/score-inspector-extension/raw/main/inspector.user.js
// @updateURL    https://github.com/darkchii/score-inspector-extension/raw/main/inspector.user.js
// ==/UserScript==

(function () {
    'use strict';

    const SCORE_INSPECTOR_API = "http://localhost:3863/";
    // const SCORE_INSPECTOR_API = "https://api.kirino.sh/inspector/";

    const IMAGE_DEFAULT_TEAM_BG = "https://cloud.kirino.sh/index.php/apps/raw/s/xn6ybB2ggC2KLcS";
    const IMAGE_ICON_SPINNER = "https://cloud.kirino.sh/index.php/apps/raw/s/4KmxzMtbEriHDXq";

    const MODE_NAMES = ["osu!", "osu!taiko", "osu!catch", "osu!mania"];
    const MODE_SLUGS = ["osu", "taiko", "catch", "mania"];
    const MODE_SLUGS_ALT = ["osu", "taiko", "fruits", "mania"];
    const GRAPHS = ["Performance", "Score"];
    const COE_ATTENDEE_TYPES = {
        'SPECTATOR_ONE_DAY': 'Spectator (1 day)',
        'SPECTATOR_ALL_DAYS': 'Spectator (all days)',
        'BYOC_ALL_DAYS': 'BYOC (all days)',
        'SPECTATOR_MIDWEEK': 'Spectator (midweek)',
        'SPECTATOR_WEEKEND': 'Spectator (weekend)',
        'BYOC_WEEKEND': 'BYOC (weekend)',
        'BYOC_MIDWEEK': 'BYOC (midweek)',
        'CAVE_MAIN': 'Cave',
        'CAVE_GUEST': 'Cave Guest',
        'BYOC_PREM_ALL_DAYS': 'BYOC+ (all days)',
    }

    // let CURRENT_GRAPH = 'Performance';
    let CURRENT_GRAPH = GM_getValue("inspector_current_graph", "Performance");

    //lets script know what elements to wait for before running
    const PAGE_ELEMENT_WAIT_LIST = {
        'user_page': '.profile-info__name',
    }

    const CUSTOM_RANKINGS_ATTRIBUTES = {
        performance: {
            name: "Performance",
            val: (user) => {
                return user.pp;
            },
            formatter: (value) => {
                return `${value.toLocaleString()}pp`;
            },
            tooltip_formatter: (value) => {
                return value.toLocaleString();
            }
        },
        total_pp: {
            name: "Total PP",
            val: (user) => {
                return user.total_pp;
            },
            formatter: (value) => {
                return shortNum(value);
            },
            tooltip_formatter: (value) => {
                return value.toLocaleString();
            }
        },
        accuracy: {
            name: "Accuracy",
            val: (user) => {
                return user.accuracy;
            },
            formatter: (value) => {
                return `${value.toFixed(2)}%`;
            },
            tooltip_formatter: (value) => {
                return `${value.toFixed(2)}%`;
            }
        },
        badges: {
            name: "Badges",
            val: (user) => {
                return user.badges;
            }
        },
        medals: {
            name: "Medals",
            val: (user) => {
                return user.medals;
            }
        },
        members: {
            name: "Members",
            val: (user) => {
                return user.members;
            }
        },
        total_score: {
            name: "Total Score",
            val: (user) => {
                return user.total_score;
            },
            formatter: (value) => {
                return shortNum(value);
            },
            tooltip_formatter: (value) => {
                return value.toLocaleString();
            }
        },
        ranked_score: {
            name: "Ranked Score",
            val: (user) => {
                return user.ranked_score;
            },
            formatter: (value) => {
                return shortNum(value);
            },
            tooltip_formatter: (value) => {
                return value.toLocaleString();
            }
        },
        ss: {
            name: "SS",
            val: (user) => {
                return user.ss_count + user.ssh_count;
            }
        },
        s: {
            name: "S",
            val: (user) => {
                return user.s_count + user.sh_count;
            }
        },
        a: {
            name: "A",
            val: (user) => {
                return user.a_count;
            }
        },
        b: {
            name: "B",
            val: (user) => {
                return user.b_count;
            }
        },
        c: {
            name: "C",
            val: (user) => {
                return user.c_count;
            }
        },
        d: {
            name: "D",
            val: (user) => {
                return user.d_count;
            }
        },
        clears: {
            name: "Clears",
            val: (user) => {
                return user.ss_count + user.ssh_count + user.s_count + user.sh_count + user.a_count;
            }
        },
        playtime: {
            name: "Playtime",
            val: (user) => {
                // return user.playtime;
                //convert to pretty format
                const hours = Math.floor(user.playtime / 3600);
                const minutes = Math.floor(user.playtime / 60) % 60;
                return `${hours}h ${minutes}m`;
            },
        },
        playcount: {
            name: "Playcount",
            val: (user) => {
                return user.playcount;
            },
        },
        replays_watched: {
            name: "Replays Watched",
            val: (user) => {
                return user.replays_watched;
            },
        },
        total_hits: {
            name: "Total Hits",
            val: (user) => {
                return user.total_hits;
            },
        },
        xp: {
            name: "XP",
            val: (user) => {
                return user.xp;
            },
        }
    }

    const CUSTOM_RANKINGS = [
        {
            name: "total score",
            api_path: "total_score",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
            ],
            path: "/rankings/osu/total_score"
        },
        {
            name: "total ss",
            api_path: "ss",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.b],
                [CUSTOM_RANKINGS_ATTRIBUTES.c],
                [CUSTOM_RANKINGS_ATTRIBUTES.d]
            ],
            path: "/rankings/osu/ss"
        },
        {
            name: "total s",
            api_path: "s",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.b],
                [CUSTOM_RANKINGS_ATTRIBUTES.c],
                [CUSTOM_RANKINGS_ATTRIBUTES.d]
            ],
            path: "/rankings/osu/s"
        },
        {
            name: "total a",
            api_path: "a",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.b],
                [CUSTOM_RANKINGS_ATTRIBUTES.c],
                [CUSTOM_RANKINGS_ATTRIBUTES.d]
            ],
            path: "/rankings/osu/a"
        },
        {
            name: "total b",
            api_path: "b",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.b, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.c],
                [CUSTOM_RANKINGS_ATTRIBUTES.d]
            ],
            path: "/rankings/osu/b"
        },
        {
            name: "total c",
            api_path: "c",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.b],
                [CUSTOM_RANKINGS_ATTRIBUTES.c, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.d]
            ],
            path: "/rankings/osu/c"
        },
        {
            name: "total d",
            api_path: "d",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.b],
                [CUSTOM_RANKINGS_ATTRIBUTES.c],
                [CUSTOM_RANKINGS_ATTRIBUTES.d, true]
            ],
            path: "/rankings/osu/d"
        },
        {
            name: "profile clears",
            api_path: "clears",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.clears, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
            ],
            path: "/rankings/osu/clears"
        },
        {
            name: "playtime",
            api_path: "playtime",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.playtime, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
            ],
            path: "/rankings/osu/playtime"
        },
        {
            name: "playcount",
            api_path: "playcount",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.playcount, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
            ],
            path: "/rankings/osu/playcount"
        },
        {
            name: "total hits",
            api_path: "total_hits",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.total_hits, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
            ],
            path: "/rankings/osu/total_hits"
        },
        {
            name: "replays watched",
            api_path: "replays_watched",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.replays_watched, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
            ],
            path: "/rankings/osu/replays_watched"
        }
    ]

    const lb_page_nav_items = [
        {
            name: "performance",
            attr: "performance",
            link: "/rankings/{mode}/performance"
        }, {
            name: "score",
            attr: "score",
            link: "/rankings/{mode}/score"
        },
        ...CUSTOM_RANKINGS.map(ranking => {
            return {
                name: ranking.name,
                attr: ranking.api_path,
                link: ranking.path
            }
        }),
        {
            name: "country",
            attr: "country",
            link: "/rankings/{mode}/country"
        }, {
            name: "team",
            attr: "team",
            link: "/rankings/{mode}/team"
        }, {
            name: "multiplayer",
            attr: "multiplayer",
            link: "/multiplayer/rooms/latest"
        }, {
            name: "daily challenge",
            attr: "daily-challenge",
            link: "/rankings/daily-challenge/.*"
        }, {
            name: "seasons",
            attr: "seasons",
            link: "/seasons/.*",
            default_linker: "latest"
        }, {
            name: "spotlights (old)",
            attr: "spotlights",
            link: "/rankings/{mode}/charts"
        }, {
            name: "kudosu",
            attr: "kudosu",
            link: "/rankings/kudosu"
        }
    ]

    let is_osuplus_active = false;

    const shortNum = (number) => {
        const postfixes = ['', 'k', 'M', 'B', 't']
        let count = 0
        while (number >= 1000 && count < postfixes.length) {
            number /= 1000
            count++
        }
        //round number to 2 decimal places
        number = Math.round(number * 100) / 100;
        return number + postfixes[count];
    }

    let MODS_DATA = null;
    async function modsDataMakeSure() {
        if (MODS_DATA) return MODS_DATA;
        const response = await fetch("https://raw.githubusercontent.com/ppy/osu-web/refs/heads/master/database/mods.json");
        if (response.status === 200) {
            // MODS_DATA = await response.json();
            // return MODS_DATA;
            let temp_data = await response.json();
            MODS_DATA = {};
            for (const mod_set of temp_data) {
                let ruleset = mod_set.Name;
                MODS_DATA[ruleset] = mod_set.Mods;
            }
            return MODS_DATA;
        } else {
            console.error("Error fetching mods data", response.status, response.statusText);
            return null;
        }
    }

    let IS_RUNNER_ACTIVE = null;
    async function run() {
        if (IS_RUNNER_ACTIVE) return;
        IS_RUNNER_ACTIVE = true;
        GM_addStyle(`
            .toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: hsl(var(--hsl-d5));
                color: #fff;
                padding: 15px;
                border-radius: 5px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                opacity: 0;
                transition: opacity 0.5s ease, transform 0.5s ease;
                transform: translateY(-80px);
                z-index: 9999;
            }

            .toast.show {
                opacity: 1;
                transform: translateY(0);
                transition: opacity 0.5s ease, transform 0.5s ease;
            }

            .beatmap-basic-stats {
                color: #fd5;
                display: flex;
                font-size: 11px;
                font-weight: 600;
                justify-content: space-between;
                box-sizing: border-box;
                gap: 2px;
            }

            .beatmap-basic-stats__entry {
                align-items: center;
                display: flex;
                flex: none;
                padding: 3px;
                box-sizing: border-box;
            }
        `);

        //check for id "osuplusSettingsBtn"
        if (document.getElementById("osuplusSettingsBtn")) {
            is_osuplus_active = true;
        }

        //if userpage
        if (window.location.href.includes("/users/")) {
            //override css font-size for class "value-display__value"
            GM_addStyle(`
                .value-display--rank .value-display__value {
                    font-size: 20px;
                }

                .value-display__label {
                    font-size: 14px;
                }
            `);
        }

        if (window.location.href.includes("/rankings/") ||
            window.location.href.includes("/multiplayer/rooms/") ||
            window.location.href.includes("/seasons/")) {
            await handleLeaderboardPage();
        }

        await runUserPage();
        await runScoreRankCompletionPercentages();
        await runScoreRankChanges();
        await runScorePage();
        await runBeatmapPage();
        await runUsernames();

        IS_RUNNER_ACTIVE = false;
    }

    function start() {
        run();
        document.addEventListener("turbo:load", run)
    }
    start();

    async function runCleanErrorPage(title, subtitle, header_data = null) {
        document.title = `${title} · ${subtitle} | osu!`;

        const container = document.getElementsByClassName("osu-layout__section osu-layout__section--full")[0];
        container.innerHTML = "";

        let header_nav = null;

        if (header_data) {
            const rankings_container = document.createElement("div");
            rankings_container.classList.add("header-v4", "header-v4--rankings");
            container.appendChild(rankings_container);

            const rankings_header = document.createElement("div");
            rankings_header.classList.add("header-v4__container", "header-v4__container--main");
            rankings_container.appendChild(rankings_header);

            const rankings_header_bg_container = document.createElement("div");
            rankings_header_bg_container.classList.add("header-v4__bg-container");
            //bg color hsl(var(--hsl-d5))
            rankings_header_bg_container.style.backgroundColor = "hsl(var(--hsl-d5))";
            rankings_header.appendChild(rankings_header_bg_container);

            const rankings_header_bg_container_bg = document.createElement("div");
            rankings_header_bg_container_bg.classList.add("header-v4__bg");
            rankings_header_bg_container.appendChild(rankings_header_bg_container_bg);

            const rankings_header_content = document.createElement("div");
            rankings_header_content.classList.add("header-v4__content");
            rankings_header.appendChild(rankings_header_content);

            const rankings_header_content_title = document.createElement("div");
            rankings_header_content_title.classList.add("header-v4__row", "header-v4__row--title");
            rankings_header_content.appendChild(rankings_header_content_title);

            const rankings_header_content_title_icon = document.createElement("div");
            rankings_header_content_title_icon.classList.add("header-v4__icon");
            rankings_header_content_title.appendChild(rankings_header_content_title_icon);

            const rankings_header_content_title_text = document.createElement("div");
            rankings_header_content_title_text.classList.add("header-v4__title");
            rankings_header_content_title_text.textContent = header_data.title ?? "placeholder";
            rankings_header_content_title.appendChild(rankings_header_content_title_text);

            const ranking_headers_container = document.createElement("div");
            ranking_headers_container.classList.add("header-v4__container");
            rankings_container.appendChild(ranking_headers_container);

            const ranking_headers_content = document.createElement("div");
            ranking_headers_content.classList.add("header-v4__content");
            ranking_headers_container.appendChild(ranking_headers_content);

            const ranking_headers_row = document.createElement("div");
            ranking_headers_row.classList.add("header-v4__row", "header-v4__row--bar");
            ranking_headers_content.appendChild(ranking_headers_row);

            const ranking_headers_row_nav = document.createElement("ul");
            ranking_headers_row_nav.classList.add("header-nav-v4", "header-nav-v4--list");
            ranking_headers_row.appendChild(ranking_headers_row_nav);

            header_nav = ranking_headers_row_nav;
        }

        return { container, header_nav };
    }

    async function runScorePage() {
        if (!window.location.href.includes("/scores/")) {
            return;
        }

        try {
            let score_id = window.location.href.split("/")[4];

            if (!parseInt(score_id)) {
                console.error("Invalid score id");
                return;
            }
            score_id = parseInt(score_id);

            await modsDataMakeSure();

            const score_data = await getScoreData();

            //Apply the attributes to the current score view
            //get element class "score-stats__group score-stats__group--stats"
            const score_stats_group = document.getElementsByClassName("score-stats__group score-stats__group--stats")[0];

            const createStat = (name, value) => {
                const stat = document.createElement("div");
                stat.classList.add("score-stats__stat");

                const stat_name = document.createElement("div");
                stat_name.classList.add("score-stats__stat-row", "score-stats__stat-row--label");
                stat_name.textContent = name;
                stat.appendChild(stat_name);

                const stat_value = document.createElement("div");
                stat_value.classList.add("score-stats__stat-row");
                stat_value.textContent = value;
                stat.appendChild(stat_value);

                return stat;
            }
            //delete if id "score-stats__group-row--extra-stats" exists
            let score_stats_group_row = document.getElementById("score-stats__group-row--extra-stats");
            if (score_stats_group_row) {
                score_stats_group_row.remove();
            }
            score_stats_group_row = document.createElement("div");
            score_stats_group_row.classList.add("score-stats__group-row");
            score_stats_group_row.id = "score-stats__group-row--extra-stats";
            score_stats_group.appendChild(score_stats_group_row);
            score_stats_group_row.appendChild(createStat("Stars", `${formatNumber(score_data.attributes.star_rating, 2)} ★`));
            switch (score_data.score.ruleset_id) {
                case 0: //osu
                    score_stats_group_row.appendChild(createStat("Aim", `${formatNumber(score_data.attributes.aim_difficulty ?? 0, 2)}★`));
                    score_stats_group_row.appendChild(createStat("Speed", `${formatNumber(score_data.attributes.speed_difficulty ?? 0, 2)}★`));
                    score_stats_group_row.appendChild(createStat("Flashlight", `${formatNumber(score_data.attributes.flashlight_difficulty ?? 0, 2)}★`));
                    break;
            }

            let ruleset_scores = {};
            let ruleset_beatmaps = {};

            //get scores for all rulesets
            for (const ruleset of MODE_SLUGS_ALT) {
                const data = await getUserBeatmapScores(score_data.score.user_id, score_data.score.beatmap_id, ruleset);
                const _scores = data.scores;
                const _beatmap = data.beatmap;
                const _attributes = data.attributes;

                //sort by pp desc
                _scores.sort((a, b) => {
                    return b.pp - a.pp;
                });

                if (_scores && _scores.length > 0) {
                    ruleset_scores[ruleset] = _scores;
                }

                if (_beatmap) {
                    ruleset_beatmaps[ruleset] = {
                        ..._beatmap,
                        attributes: _attributes
                    };
                }
            }

            //find the element with class "score-stats"
            const score_stats = document.getElementsByClassName("score-stats")[0];

            //insert an empty div after the score-stats element (this will contain all extra scores)
            // const extra_scores_div = document.createElement("div");
            let extra_scores_div = document.getElementById("score-stats__group-row--extra-scores");
            if (extra_scores_div) {
                extra_scores_div.remove();
            }
            extra_scores_div = document.createElement("div");
            extra_scores_div.classList.add("score-stats");
            extra_scores_div.id = "score-stats__group-row--extra-scores";
            //force full width
            extra_scores_div.style.width = "100%";

            //insert
            score_stats.parentNode.insertBefore(extra_scores_div, score_stats.nextSibling);

            //if scores is empty, just insert a message
            if (!ruleset_scores || Object.keys(ruleset_scores).length === 0) {
                const no_scores = document.createElement("div");
                no_scores.classList.add("no-scores");
                no_scores.textContent = "User has no scores on this beatmap";
                extra_scores_div.appendChild(no_scores);
                return;
            } else {
                const proxy_scoreboard_element = document.createElement("div");
                proxy_scoreboard_element.classList.add("beatmapset-scoreboard");
                proxy_scoreboard_element.style.width = "100%";

                extra_scores_div.appendChild(proxy_scoreboard_element);
                for (const ruleset of MODE_SLUGS_ALT) {
                    if (!ruleset_scores[ruleset]) continue;

                    const proxy_scoreboard_item_element = document.createElement("div");
                    proxy_scoreboard_item_element.classList.add("beatmapset-scoreboard__main");

                    const ruleset_scores_container = document.createElement("div");
                    ruleset_scores_container.classList.add("beatmap-scoreboard-top__item");
                    proxy_scoreboard_item_element.appendChild(ruleset_scores_container);

                    // ruleset_scores_container.innerHTML = `<h3>${ruleset}</h3>`;
                    // extra_scores_div.appendChild(ruleset_scores_container);
                    const ruleset_scores_header = document.createElement("h4");
                    ruleset_scores_header.classList.add("ruleset-scores-header");

                    const ruleset_scores_header_icon = document.createElement("span");
                    //give it "fal fa-extra-mode-${ruleset}" class
                    ruleset_scores_header_icon.classList.add("fal", `fa-extra-mode-${ruleset}`);
                    ruleset_scores_header.appendChild(ruleset_scores_header_icon);

                    const ruleset_scores_header_text = document.createElement("span");
                    ruleset_scores_header_text.textContent = ` ${ruleset}`;
                    ruleset_scores_header.appendChild(ruleset_scores_header_text);

                    ruleset_scores_container.appendChild(ruleset_scores_header);
                    proxy_scoreboard_element.appendChild(proxy_scoreboard_item_element);

                    // const score_element = getUserScoreElement(scores[ruleset][0]);
                    // for (const [index, score] of scores[ruleset]) {
                    for (const [index, score] of ruleset_scores[ruleset].entries()) {
                        const score_element = getUserScoreElement(score, score_data.score.user, ruleset_beatmaps[ruleset], index);
                        if (!score_element) continue;

                        if (score_data.score.id == score.id) {
                            //add a subtle gold glow to the score element
                            //not a class, use inline style
                            score_element.style.boxShadow = "0 0 10px 5px rgba(255, 215, 0, 0.5)";
                        }

                        ruleset_scores_container.appendChild(score_element);
                    }
                }
            }
        } catch (err) {
            console.error(err);
        }

    }

    function getUserScoreElement(score, user, beatmap, index) {
        let time_ago = null;
        let time_ago_long = null;
        //time_ago is a simple string i.e: 2d (2 days ago), 1m (1 month ago), 1y (1 year ago)
        if (score.ended_at) {
            const date = new Date(score.ended_at);
            const now = new Date();
            const diff = now - date;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
            const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
            if (days < 30) {
                time_ago = `${days}d`;
                time_ago_long = `${days} day${days > 1 ? 's' : ''} ago`;
            } else if (months < 12) {
                time_ago = `${months}m`;
                time_ago_long = `${months} month${months > 1 ? 's' : ''} ago`;
            } else {
                time_ago = `${years}y`;
                time_ago_long = `${years} year${years > 1 ? 's' : ''} ago`;
            }
        } else {
            time_ago = "N/A";
            time_ago_long = "N/A";
        }

        //just make a test element and see if it works
        const score_element = document.createElement("div");
        score_element.classList.add("beatmap-scoreboard-top__item");

        const beatmap_score_top = document.createElement("div");
        beatmap_score_top.classList.add("beatmap-score-top");

        const score_element_link = document.createElement("a");
        score_element_link.classList.add("beatmap-score-top__link-container");
        score_element_link.href = `https://osu.ppy.sh/scores/${score.id}`;
        beatmap_score_top.appendChild(score_element_link);

        const beatmap_score_section = document.createElement("div");
        beatmap_score_section.classList.add("beatmap-score-top__section");
        //change padding to 5px
        beatmap_score_section.style.padding = "5px";

        beatmap_score_top.appendChild(beatmap_score_section);
        score_element.appendChild(beatmap_score_top);

        //Create user portion of the score card
        const user_card = document.createElement("div");
        user_card.classList.add("beatmap-score-top__wrapping-container", "beatmap-score-top__wrapping-container--left");

        //Position element
        const score_position_rank = getUserScoreElementPosition(score, index);
        user_card.appendChild(score_position_rank);

        //Avatar element
        const score_avatar = document.createElement("div");
        score_avatar.classList.add("beatmap-score-top__avatar");

        const score_avatar_link = document.createElement("a");
        score_avatar_link.classList.add("u-hover");
        score_avatar_link.href = `https://osu.ppy.sh/users/${score.user_id}`;
        score_avatar.appendChild(score_avatar_link);

        const score_avatar_link_image = document.createElement("span");
        score_avatar_link_image.classList.add("avatar", "avatar--guest");
        score_avatar_link_image.style.backgroundImage = `url(https://a.ppy.sh/${score.user_id})`;
        //set width+height to 50px
        score_avatar_link_image.style.width = "50px";
        score_avatar_link_image.style.height = "50px";
        score_avatar_link.appendChild(score_avatar_link_image);

        user_card.appendChild(score_avatar);

        //create player element
        const score_player = getUserScoreElementPlayer(score, user, time_ago_long);
        //add user card
        beatmap_score_section.appendChild(user_card);

        const score_card = document.createElement("div");
        score_card.classList.add("beatmap-score-top__wrapping-container", "beatmap-score-top__wrapping-container--right");

        const score_stat_group_score_parent = document.createElement("div");
        score_stat_group_score_parent.classList.add("beatmap-score-top__stats");
        score_stat_group_score_parent.appendChild(getScoreStatElement("Total Score", score.classic_total_score, 'score'));

        const score_stat_group_acc_parent = document.createElement("div");
        score_stat_group_acc_parent.classList.add("beatmap-score-top__stats");
        score_stat_group_acc_parent.appendChild(getScoreStatElement("Accuracy", score.accuracy * 100, score.accuracy == 1 ? 'perfect' : '', (value) => { return formatNumber(value, 2) + "%"; }));
        score_stat_group_acc_parent.appendChild(getScoreStatElement("Max Combo", score.max_combo, score.max_combo == (beatmap.attributes?.max_combo ?? beatmap.max_combo) ? 'perfect' : '', (value) => { return `${value.toLocaleString()}x`; }));

        const score_stat_group_detail_parent = document.createElement("div");
        score_stat_group_detail_parent.classList.add("beatmap-score-top__stats", "beatmap-score-top__stats--wrappable");
        switch (score.ruleset_id) {
            case 0: //osu
                score_stat_group_detail_parent.appendChild(getScoreStatElement("300", score.statistics.great ?? 0, 'smaller'));
                score_stat_group_detail_parent.appendChild(getScoreStatElement("100", score.statistics.ok ?? 0, 'smaller'));
                score_stat_group_detail_parent.appendChild(getScoreStatElement("50", score.statistics.meh ?? 0, 'smaller',));
                score_stat_group_detail_parent.appendChild(getScoreStatElement("Miss", score.statistics.miss ?? 0, 'smaller'));
                break;
            case 1: //taiko
                score_stat_group_detail_parent.appendChild(getScoreStatElement("Great", score.statistics.great ?? 0, 'smaller'));
                score_stat_group_detail_parent.appendChild(getScoreStatElement("Good", score.statistics.ok ?? 0, 'smaller'));
                score_stat_group_detail_parent.appendChild(getScoreStatElement("Miss", score.statistics.miss ?? 0, 'smaller'));
                break;
            case 2: //fruits
                score_stat_group_detail_parent.appendChild(getScoreStatElement("Fruits", score.statistics.great ?? 0, 'smaller'));
                score_stat_group_detail_parent.appendChild(getScoreStatElement("Ticks", score.statistics.large_tick_hit ?? 0, 'smaller'));
                score_stat_group_detail_parent.appendChild(getScoreStatElement("DRP Miss", score.statistics.small_tick_miss ?? 0, 'smaller'));
                score_stat_group_detail_parent.appendChild(getScoreStatElement("Miss", score.statistics.miss ?? 0, 'smaller'));
                break;
            case 3: //mania
                score_stat_group_detail_parent.appendChild(getScoreStatElement("Max", score.statistics.perfect ?? 0, 'smaller'));
                score_stat_group_detail_parent.appendChild(getScoreStatElement("300", score.statistics.great ?? 0, 'smaller'));
                score_stat_group_detail_parent.appendChild(getScoreStatElement("200", score.statistics.good ?? 0, 'smaller'));
                score_stat_group_detail_parent.appendChild(getScoreStatElement("100", score.statistics.ok ?? 0, 'smaller'));
                score_stat_group_detail_parent.appendChild(getScoreStatElement("50", score.statistics.meh ?? 0, 'smaller'));
                score_stat_group_detail_parent.appendChild(getScoreStatElement("Miss", score.statistics.miss ?? 0, 'smaller'));
                break;
        }
        score_stat_group_detail_parent.appendChild(getScoreStatElement("pp", score.pp ? formatNumber(score.pp, 2) : '-', 'smaller'));
        score_stat_group_detail_parent.appendChild(getScoreStatElement("Time", time_ago, 'smaller'));
        score_stat_group_detail_parent.appendChild(getScoreStatElement("Mods", score.mods, 'mods', null, { ruleset: score.ruleset_id }));

        score_card.appendChild(score_stat_group_score_parent);
        score_card.appendChild(score_stat_group_acc_parent);
        score_card.appendChild(score_stat_group_detail_parent);

        user_card.appendChild(score_player);
        beatmap_score_section.appendChild(score_card);

        return score_element;
    }

    function getScoreStatElement(header, value, type = null, formatter = null, data = {}) {
        const element = document.createElement("div");
        element.classList.add("beatmap-score-top__stat");

        const header_element = document.createElement("div");
        header_element.classList.add("beatmap-score-top__stat-header");
        //set padding-bottom to 0px
        header_element.style.paddingBottom = "0px";
        if (type !== 'smaller') {
            header_element.classList.add("beatmap-score-top__stat-header--wider");
        }
        header_element.textContent = header;

        const value_element = document.createElement("div");
        if (type !== 'mods') {
            value_element.textContent = formatter ? formatter(value) : value.toLocaleString();
        } else {
            //only slightly more complex
            let mod_set = MODS_DATA[MODE_SLUGS_ALT[data.ruleset]];
            for (const mod of value) {
                const mod_element = document.createElement("div");
                //find the mod_data where Acronym == mod.acronym
                const mod_data = mod_set.find(m => m.Acronym == mod.acronym);
                if (!mod_data) {
                    console.error("Mod data not found", mod.acronym);
                    continue;
                }
                //class: mod mod--DT mod--type-DifficultyIncrease
                mod_element.classList.add("mod", `mod--${mod_data.Acronym}`, `mod--type-${mod_data.Type}`);
                mod_element.setAttribute("data-acronym", mod_data.Acronym);
                value_element.appendChild(mod_element);
            }
        }
        value_element.classList.add("beatmap-score-top__stat-value", `beatmap-score-top__stat-value${type ? `--${type}` : ""}`);
        //set margin-top to 0px
        value_element.style.marginTop = "0px";

        element.appendChild(header_element);
        element.appendChild(value_element);

        return element;
    }

    function getUserScoreElementPlayer(score, user, time_ago) {
        const user_box = document.createElement("div");
        user_box.classList.add("beatmap-score-top__user-box");

        const user_name_element = document.createElement("a");
        user_name_element.classList.add("js-usercard", "beatmap-score-top__username", "u-hover");
        user_name_element.href = `https://osu.ppy.sh/users/${score.user_id}`;
        user_name_element.target = "_blank";
        user_name_element.rel = "noopener noreferrer";
        user_name_element.setAttribute("data-user-id", score.user_id);
        user_name_element.textContent = user.username;
        user_box.appendChild(user_name_element);

        const date_played_element = document.createElement("div");
        date_played_element.classList.add("beatmap-score-top__achieved", "u-hover");
        date_played_element.textContent = "achieved " + time_ago;
        const date_played_time_element = document.createElement("time");
        date_played_time_element.classList.add("js-timeago");
        date_played_time_element.setAttribute("datetime", score.date_achieved);
        date_played_element.appendChild(date_played_time_element);
        user_box.appendChild(date_played_element);

        const flags_container_element = document.createElement("div");
        flags_container_element.classList.add("beatmap-score-top__flags");
        user_box.appendChild(flags_container_element);

        const country_flag_element = document.createElement("a");
        country_flag_element.classList.add("u-hover");
        country_flag_element.href = `https://osu.ppy.sh/rankings/osu/performance?country=${user.country_code}`;
        const country_flag_sub_element = document.createElement("span");
        country_flag_sub_element.classList.add("flag-country", "flag-country--flat");
        country_flag_sub_element.style.backgroundImage = `url(https://osu.ppy.sh/assets/images/flags/${countryCodeToUnicodeHex(user.country_code)}.svg)`;
        country_flag_sub_element.setAttribute("original-title", user.country.name);
        country_flag_sub_element.setAttribute("data-orig-title", user.country.name);
        country_flag_element.appendChild(country_flag_sub_element);
        flags_container_element.appendChild(country_flag_element);

        if (user.team) {
            const team_flag_element = document.createElement("a");
            team_flag_element.classList.add("u-hover");
            team_flag_element.href = `https://osu.ppy.sh/teams/${user.team.id}`;
            const team_flag_sub_element = document.createElement("span");
            team_flag_sub_element.classList.add("flag-team");
            team_flag_sub_element.style.backgroundImage = `url(${user.team.flag_url})`;
            team_flag_sub_element.setAttribute("original-title", user.team.name);
            team_flag_sub_element.setAttribute("data-orig-title", user.team.name);
            team_flag_element.appendChild(team_flag_sub_element);
            flags_container_element.appendChild(team_flag_element);
        }

        return user_box;
    }

    function getUserScoreElementPosition(score, index) {
        const score_position = document.createElement("div");
        score_position.classList.add("beatmap-score-top__position-number");
        score_position.textContent = `#${index + 1}`;

        const score_rank = document.createElement("div");
        score_rank.classList.add("score-rank", "score-rank--tiny", `score-rank--${score.rank}`);

        const element = document.createElement("div");
        element.classList.add("beatmap-score-top__position");

        element.appendChild(score_position);
        element.appendChild(score_rank);

        return element;
    }

    async function getUserBeatmapScores(user_id, beatmap_id, ruleset) {
        try {
            console.log(`Fetching beatmap scores for user ${user_id} on beatmap ${beatmap_id} with ruleset ${ruleset}`);
            const response = await fetch(`${SCORE_INSPECTOR_API}extension/scores/${beatmap_id}/${user_id}/${ruleset}`, {
                method: "GET"
            });

            if (response.status === 200) {
                const data = await response.json();
                return data;
            } else {
                console.error("Error fetching beatmap scores", response.status, response.statusText);
                return null;
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function getScoreData() {
        try {
            //find script with id "json-raw"
            const script = document.getElementById("json-show");
            if (!script) {
                console.error("Score data not found");
                return null;
            }

            let score = JSON.parse(script.innerHTML);
            if (!score) {
                console.error("Something went wrong parsing score data");
                return null;
            }

            let attributes = await getBeatmapAttributes(score.beatmap_id, score.ruleset_id, score.mods);

            return {
                score: score,
                attributes: attributes
            }
        } catch (err) {
            console.error(err);
        }
    }

    function countryCodeToUnicodeHex(countryCode) {
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

    async function runBeatmapPage() {
        if (!window.location.href.includes("/beatmapsets/")) {
            return;
        }

        let is_running = false;
        const runner = async () => {
            if (is_running) return;
            if (!window.location.href.includes("/beatmapsets/")) {
                return;
            }

            //EXAMPLE URL: https://osu.ppy.sh/beatmapsets/1589026#osu/3245641

            const beatmapset_id = window.location.href.split("/")[4];
            if (!parseInt(beatmapset_id)) {
                console.error("Invalid beatmapset id");
                return;
            }
            const active_beatmap_id = window.location.href.replace(`https://osu.ppy.sh/beatmapsets/${beatmapset_id}/`, "").split("/")[0];

            if (!parseInt(active_beatmap_id)) {
                console.error("Invalid beatmap id");
                return;
            }

            //find the active mode
            let active_mode = window.location.href.split("#")[1]?.split("/")[0];
            if (!active_mode) {
                active_mode = "osu";
            }

            await WaitForElement(".beatmap-basic-stats", 1000);
            await WaitForElement(".beatmap-stats-table", 1000);

            const beatmap_basic_stats = document.getElementsByClassName("beatmap-basic-stats")[0];
            const beatmap_stats_table = document.getElementsByClassName("beatmap-stats-table")[0];

            if (!beatmap_basic_stats || !beatmap_stats_table) {
                console.error("Beatmap basic stats or stats table not found");
                return;
            }

            removeBeatmapBasicStatsEntry(beatmap_basic_stats, "spinner-count");
            removeBeatmapTableStatsEntry(beatmap_stats_table, "diff-aim");
            removeBeatmapTableStatsEntry(beatmap_stats_table, "diff-speed");

            //get beatmap data
            const beatmap_data = await getBeatmapData(active_beatmap_id, active_mode);

            if (beatmap_data && !Array.isArray(beatmap_data)) {
                const beatmap_set = beatmap_data.beatmapset_data;
                const beatmap = beatmap_data.beatmap_data;
                const attributes = beatmap_data.attributes;

                addBeatmapBasicStatsEntry(beatmap_basic_stats, IMAGE_ICON_SPINNER, 'spinner-count', "Spinner Count", beatmap.count_spinners);

                if (attributes) {
                    if (active_mode === 'osu') {
                        addBeatmapTableStatsEntry(beatmap_stats_table, 'diff-aim', "Stars Aim", formatNumber(attributes.aim_difficulty, 2), attributes.aim_difficulty * 10);
                        addBeatmapTableStatsEntry(beatmap_stats_table, 'diff-speed', "Stars Speed", formatNumber(attributes.speed_difficulty, 2), attributes.speed_difficulty * 10);
                    }
                }
            }

            is_running = false;
        }

        runner();
    }

    function removeBeatmapBasicStatsEntry(beatmap_basic_stats, internal_title) {
        if (beatmap_basic_stats.querySelector(`#beatmap-basic-stats__entry--${internal_title}`)) {
            beatmap_basic_stats.querySelector(`#beatmap-basic-stats__entry--${internal_title}`).remove();
        }
    }

    function removeBeatmapTableStatsEntry(beatmap_stats_table, internal_title) {
        if (beatmap_stats_table.querySelector(`#beatmap-stats-table__entry--${internal_title}`)) {
            beatmap_stats_table.querySelector(`#beatmap-stats-table__entry--${internal_title}`).remove();
        }
    }

    function addBeatmapBasicStatsEntry(beatmap_basic_stats, icon_url, internal_title, title, value) {
        removeBeatmapBasicStatsEntry(beatmap_basic_stats, internal_title);

        const last_entry = beatmap_basic_stats.children[beatmap_basic_stats.children.length - 1];
        const new_entry = last_entry.cloneNode(true);
        //change "data-orig-title"
        new_entry.setAttribute("title", title);

        //remove data-has-qtip and aria-describedby
        new_entry.removeAttribute("data-has-qtip");
        new_entry.removeAttribute("aria-describedby");
        new_entry.removeAttribute("data-orig-title");
        //give it an unique id
        new_entry.id = `beatmap-basic-stats__entry--${internal_title}`;
        //change child span
        new_entry.children[1].textContent = value;

        new_entry.children[0].style.backgroundImage = `url(${icon_url})`;

        if (!beatmap_basic_stats.querySelector(`#beatmap-basic-stats__entry--spinner-count`)) {
            beatmap_basic_stats.appendChild(new_entry);
        }
    }

    function addBeatmapTableStatsEntry(beatmap_stats_table, internal_title, title, value, fill = 0) {
        removeBeatmapTableStatsEntry(beatmap_stats_table, internal_title);

        //get tbody
        const beatmap_stats_table_tbody = beatmap_stats_table.querySelector("tbody");

        const last_entry = beatmap_stats_table_tbody.children[beatmap_stats_table_tbody.children.length - 1];

        const new_entry = last_entry.cloneNode(true);
        //set ID
        new_entry.id = `beatmap-stats-table__entry--${internal_title}`;

        //set content of th with class beatmap-stats-table__label
        new_entry.querySelector(".beatmap-stats-table__label").textContent = title;

        //set content of td with class beatmap-stats-table__value
        new_entry.querySelector(".beatmap-stats-table__value").textContent = value;

        //TODO; set bar value

        //get the element with classes "bar bar--beatmap-stats"
        const bar = new_entry.querySelector(".bar.bar--beatmap-stats");

        //replace the full class with "bar bar--beatmap-stats bar bar--beatmap-stats--${internal_title}"
        bar.className = `bar bar--beatmap-stats bar--beatmap-stats--${internal_title}`;

        //set the style to --fill: ${fill}%
        bar.style.setProperty("--fill", `${Math.min(100, Math.max(0, fill))}%`);

        if (!beatmap_stats_table.querySelector(`#beatmap-stats-table__entry--${internal_title}`)) {
            beatmap_stats_table_tbody.appendChild(new_entry);
        }
    }

    //Add team tags
    async function runUsernames() {
        let isWorking = false;

        const _func = async () => {
            if (isWorking) return;

            isWorking = true;
            try {
                await new Promise(r => setTimeout(r, 1000));
                if (window.location.href.includes("/beatmapsets/")) {
                    if (is_osuplus_active) {
                        await WaitForElement('.osu-plus', 1000); //osu-plus updates leaderboards, so we wait for it in case user has it enabled
                    }
                }

                const usercards = document.getElementsByClassName("js-usercard");
                const usercards_big = document.getElementsByClassName("user-card");
                //remove found elements that already have a (nested) child with class "inspector_user_tag"
                const usercards_filtered = Array.from(usercards).filter(card => !card.querySelector(".inspector_user_tag"));
                const usercards_big_filtered = Array.from(usercards_big).filter(card => !card.querySelector(".inspector_user_tag"));

                const user_ids = Array.from(usercards_filtered).map(card => card.getAttribute("data-user-id"));
                const user_ids_big = Array.from(usercards_big_filtered).map(card => getUserCardBigID(card));
                const _user_ids = user_ids.concat(user_ids_big).filter((v, i, a) => a.indexOf(v) === i);

                const teams = await getTeams(_user_ids);

                if (teams && Object.keys(teams).length > 0) {
                    modifyJsUserCards(teams);
                }
            } catch (err) {
                console.error(err);
            }
            isWorking = false;
        }
        await _func();

        const observer = new MutationObserver((mutationsList, observer) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    if (window.location.href.includes("/users/") || window.location.href.includes("/u/")) {
                        if (mutation.target.classList.contains("osu-layout__col-container")) {
                            _func();
                        }
                    } else if (window.location.href.includes("/beatmapsets")) {
                        if (
                            mutation.target.classList.contains("beatmapset-scoreboard__main") ||
                            mutation.target.classList.contains("beatmap-scoreboard-table") ||
                            mutation.target.classList.contains("beatmap-scoreboard-table__body") ||
                            mutation.target.classList.contains("beatmapsets__content") ||
                            mutation.target.classList.contains("beatmapsets") ||
                            mutation.target.classList.contains("osuplus-table")) {
                            _func();
                        }
                    } else if (window.location.href.includes("/community/chat")) {
                        if (mutation.target.classList.contains("chat-conversation")) {
                            _func();
                        }
                    } else if (window.location.href.includes("/home/friends")) {
                        if (mutation.target.classList.contains("user-list__items")) {
                            _func();
                        }
                    }

                    if (mutation.target.classList.contains("qtip--user-card")) {
                        _func();
                    }
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

    }

    function modifyJsUserCards(teams) {
        if (!teams || Object.keys(teams).length === 0) return;

        let usercards = document.querySelectorAll("[class*='js-usercard'], [class*='user-card']");
        usercards = Array.from(usercards).filter(card => !card.classList.contains("comment__avatar"));
        usercards = usercards.filter(card => !card.querySelector(".avatar.avatar--guest.avatar--beatmapset"));
        usercards = usercards.filter(card => !card.parentElement.classList.contains("chat-conversation__new-chat-avatar"));
        usercards = usercards.filter(card => !card.parentElement.classList.contains("beatmap-discussion-user-card__avatar"));

        if (window.location.href.includes("/rankings/")) {
            const userLinks = document.getElementsByClassName("ranking-page-table__user-link");
            const userLinksArray = Array.from(userLinks);
            let uses_region_flags = false;
            uses_region_flags = userLinksArray.some(link => link.children[0].tagName === "DIV" && link.children[0].children.length > 1);
        }

        for (let i = 0; i < usercards.length; i++) {
            let user_id = null;
            let team = null;

            if (usercards[i].classList.contains("user-card")) {
                user_id = getUserCardBigID(usercards[i]);
                if (!user_id) continue;

                team = teams[user_id];
                if (!team) continue;

                setBigUserCardTeamTag(usercards[i], team.team);
                continue;
            }

            user_id = usercards[i].getAttribute("data-user-id");
            if (!user_id) continue;
            team = teams[user_id];

            if (!team) continue;

            setUserCardBrickTeamTag(usercards[i], team.team);
        }
    }

    function setBigUserCardTeamTag(card, team) {
        const usernameElement = card.getElementsByClassName("user-card__username u-ellipsis-pre-overflow")[0];

        if (usernameElement.getElementsByClassName("inspector_user_tag").length > 0) {
            return;
        }
        const teamTag = generateTagSpan(team);
        usernameElement.insertBefore(teamTag, usernameElement.childNodes[0]);
    }

    function setUserCardBrickTeamTag(card, team) {
        let username = card.textContent;
        username = username.trim();
        const teamTag = generateTagSpan(team);


        if (card.classList.contains("beatmap-scoreboard-table__cell-content") ||
            card.classList.contains("beatmap-discussion-user-card__user-link")) {
            teamTag.style.paddingRight = "4px";
        }

        const usercardLink = card.getElementsByClassName("user-card-brick__link")[0];

        if (usercardLink) {
            if (usercardLink.getElementsByClassName("inspector_user_tag").length > 0) {
                return;
            }

            teamTag.style.marginRight = "5px";
            usercardLink.insertBefore(teamTag, usercardLink.childNodes[1]);
        } else if (card.parentElement.classList.contains("chat-message-group__sender")) {
            if (card.parentElement.getElementsByClassName("inspector_user_tag").length > 0) {
                return;
            }
            const parent = card.parentElement;
            const usernameElement = parent.getElementsByClassName("chat-message-group__username")[0];
            usernameElement.insertBefore(teamTag, usernameElement.childNodes[0]);
        } else {
            if (card.getElementsByClassName("inspector_user_tag").length > 0) {
                return;
            }
            let index = 0;
            //if parent has class "team-members-leaderboard-item__username", index = 1
            if (card.classList.contains("team-members-leaderboard-item__username")) {
                index = 2;
            }

            //if theres a child element of card with class "forum-user-icon", index = 1
            const userIcon = card.getElementsByClassName("forum-user-icon")[0];
            if (userIcon) {
                index = 1;
            }

            card.insertBefore(teamTag, card.childNodes[index]);
        }
    }

    const generateTagSpan = (team) => {
        const teamTag = document.createElement("a");
        teamTag.textContent = `[${team.short_name}] `;
        teamTag.style.color = `${team.color}`;
        teamTag.style.fontWeight = "bold";
        teamTag.href = `https://osu.ppy.sh/teams/${team.id}`;
        teamTag.target = "_blank";
        teamTag.style.whiteSpace = "nowrap";
        teamTag.classList.add("inspector_user_tag");
        return teamTag;
    }

    function getUserCardBigID(card) {
        const a = card.querySelector("a");
        const href_split = a.href.split("/");
        const user_id = href_split[href_split.length - 1];
        return user_id;
    }

    const USER_TEAM_CACHE = {};
    const SKIP_USER_TEAM_FETCH = []; //these don't have teams, so we skip them for this session
    async function getTeams(user_id_array) {
        if (!user_id_array || user_id_array.length === 0) {
            return null;
        }

        //remove users that are in the SKIP_USER_TEAM_FETCH array
        user_id_array = user_id_array.filter(user_id => !SKIP_USER_TEAM_FETCH.includes(user_id));

        let team_map = {};

        //check if we have the data in cache
        user_id_array.forEach(user_id => {
            if (USER_TEAM_CACHE[user_id]) {
                team_map[user_id] = USER_TEAM_CACHE[user_id];
            }
        });

        //filter out the user_ids that are already in the cache
        user_id_array = user_id_array.filter(user_id => !USER_TEAM_CACHE[user_id]);

        if (user_id_array.length === 0) {
            return team_map;
        }

        console.log(`Fetching ${user_id_array.length} users teams from remote...`);

        const teams = await fetch(`${SCORE_INSPECTOR_API}extension/users/teams`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GM_getValue("access_token")}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ids: user_id_array
            })
        }).then(res => res.json()).catch(err => {
            console.error(err);
            return null;
        });

        if (teams && Array.isArray(teams) && teams.length > 0) {
            teams.forEach(team => {
                team_map[team.user_id] = team;
                USER_TEAM_CACHE[team.user_id] = team;
            });

            //check if we have any users that don't have teams
            //remove users that don't have teams from the user_id_array
            const no_team_users = user_id_array.filter(user_id => !teams.find(team => team.user_id == user_id));
            if (no_team_users.length > 0) {
                no_team_users.forEach(user_id => {
                    SKIP_USER_TEAM_FETCH.push(user_id);
                });
            }
        }


        return team_map;
    }

    function createPagination(page, base_url, max_rank_page = 200) {
        const nav = document.createElement("nav");
        nav.classList.add("pagination-v2");

        const nav_prev_col = document.createElement("div");
        nav_prev_col.classList.add("pagination-v2__col");

        let nav_prev_span = null;
        if (page === 1) {
            nav_prev_span = document.createElement("span");
            nav_prev_span.classList.add("pagination-v2__link", "pagination-v2__link--quick", "pagination-v2__link--disabled");
        } else {
            nav_prev_span = document.createElement("a");
            nav_prev_span.classList.add("pagination-v2__link", "pagination-v2__link--quick");
            // nav_prev_span.href = `/rankings/osu/ss?page=${page - 1}`;
            nav_prev_span.href = `${base_url}?page=${page - 1}`;
        }
        const nav_prev_span_icon = document.createElement("i");
        nav_prev_span_icon.classList.add("fas", "fa-angle-left");
        nav_prev_span.appendChild(nav_prev_span_icon);
        nav_prev_span.appendChild(document.createTextNode(" "));
        const nav_prev_span_text = document.createElement("span");
        nav_prev_span_text.textContent = "PREV";
        nav_prev_span.appendChild(nav_prev_span_text);
        nav_prev_col.appendChild(nav_prev_span);
        nav.appendChild(nav_prev_col);

        const nav_next_col = document.createElement("div");
        nav_next_col.classList.add("pagination-v2__col");

        const BUTTONS_BEFORE_CURRENT_PAGE = 2;
        const BUTTONS_AFTER_CURRENT_PAGE = 2;

        //1 and 200 are always shown
        const _createPageButton = (_page, active = false) => {
            const li = document.createElement("li");
            li.classList.add("pagination-v2__item");

            let a = null;
            if (_page === page) {
                a = document.createElement("span");
            } else {
                a = document.createElement("a");
            }
            a.classList.add("pagination-v2__link");
            // a.href = `/rankings/osu/ss?page=${_page}`;
            a.href = `${base_url}?page=${_page}`;
            if (active) {
                a.classList.add("pagination-v2__link--active");
            }
            a.textContent = _page;

            li.appendChild(a);

            return li;
        }

        const pagination_items = document.createElement("div");
        pagination_items.classList.add("pagination-v2__col", "pagination-v2__col--pages");
        nav.appendChild(pagination_items);

        //just loop between 1 and 200
        for (let i = 1; i <= max_rank_page; i++) {
            if (i === 1 || i === max_rank_page || (i >= page - BUTTONS_BEFORE_CURRENT_PAGE && i <= page + BUTTONS_AFTER_CURRENT_PAGE)) {
                pagination_items.appendChild(_createPageButton(i, i === page));
            } else if (i === page - BUTTONS_BEFORE_CURRENT_PAGE - 1 || i === page + BUTTONS_AFTER_CURRENT_PAGE + 1) {
                const li = document.createElement("li");
                li.classList.add("pagination-v2__item");
                li.textContent = "...";
                pagination_items.appendChild(li);
            }
        }

        let nav_next_span = null;
        if (page === max_rank_page) {
            nav_next_span = document.createElement("span");
            nav_next_span.classList.add("pagination-v2__link", "pagination-v2__link--quick", "pagination-v2__link--disabled");
        } else {
            nav_next_span = document.createElement("a");
            nav_next_span.classList.add("pagination-v2__link", "pagination-v2__link--quick");
            // nav_next_span.href = `/rankings/osu/ss?page=${page + 1}`;
            nav_next_span.href = `${base_url}?page=${page + 1}`;;
        }
        const nav_next_span_icon = document.createElement("i");
        const nav_next_span_text = document.createElement("span");
        nav_next_span_text.textContent = "NEXT";
        nav_next_span.appendChild(nav_next_span_text);
        nav_next_span.appendChild(document.createTextNode(" "));
        nav_next_span_icon.classList.add("fas", "fa-angle-right");
        nav_next_span.appendChild(nav_next_span_icon);
        nav_next_col.appendChild(nav_next_span);
        nav.appendChild(nav_next_col);

        return nav;
    }

    function createRankingNavigation(data) {
        data.nav.innerHTML = "";
        data.items.forEach(item => {
            if (!data.nav.querySelector(`[data-content="${item.attr}"]`)) {
                const li = document.createElement("li");
                li.classList.add("header-nav-v4__item");
                data.nav.appendChild(li);

                const a = document.createElement("a");
                a.classList.add("header-nav-v4__link");
                a.href = `https://osu.ppy.sh${item.link.replace("/.*", item.default_linker ? `/${item.default_linker}` : "").replace("{mode}", data.mode)}`;
                a.textContent = item.name;
                a.setAttribute("data-content", item.attr);
                li.appendChild(a);

                if (data.active !== null && item.attr.toLowerCase() === data.active.toLowerCase()) {
                    a.classList.add("header-nav-v4__link--active");
                }
            }
        });
    }

    function createTableHeaderItem(text = '', is_focus = false, is_grade = false) {
        const th = document.createElement("th");
        th.textContent = text;
        th.classList.add("ranking-page-table__heading");
        if (is_grade) {
            th.classList.add("ranking-page-table__heading--grade");
        }
        if (is_focus) {
            th.classList.add("ranking-page-table__heading--focused");
        }
        return th;
    }

    async function handleLeaderboardPage() {
        //find ul with class "header-nav-v4 header-nav-v4--list"
        let headerNav = document.getElementsByClassName("header-nav-v4 header-nav-v4--list")[0];

        //check if we are on any of the rankings pages in CUSTOM_RANKINGS
        //remove the query string from the url
        let url = window.location.href.split("?")[0];
        //remove the domain from the url
        url = url.replace("https://osu.ppy.sh", "");

        let mode = 'osu';
        // /rankings/osu/...
        // /rankings/taiko/... we need to get the mode from the url
        if (url.includes("/rankings/")) {
            mode = url.split("/")[2];

            if (!MODE_SLUGS_ALT.includes(mode)) {
                mode = 'osu';
            }
        }

        const active_custom_ranking = CUSTOM_RANKINGS.find(ranking => ranking.path === url);
        // const active_custom_ranking = lb_page_nav_items.find(item => item.link === url);
        if (active_custom_ranking) {
            //set body style to "--base-hue-default: 115; --base-hue-override: 115"
            document.body.style.setProperty("--base-hue-default", 115);
            document.body.style.setProperty("--base-hue-override", 115);

            // const container = await runCleanErrorPage(active_custom_ranking.name, "rankings");
            const page_data = await runCleanErrorPage(active_custom_ranking.name, "rankings", {
                title: "rankings"
            });
            const container = page_data.container;
            headerNav = page_data.header_nav;

            const scores_container = document.createElement("div");
            scores_container.classList.add("osu-page", "osu-page--generic");
            scores_container.id = "scores";
            container.appendChild(scores_container);

            //get page from url query
            let page = new URLSearchParams(window.location.search).get("page") ?? 1;
            page = Number(page) || 1;

            //first try to get data now
            const fetch_url = `${SCORE_INSPECTOR_API}extension/rank/${active_custom_ranking.api_path}/${page}`;
            const response = await fetch(fetch_url, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                }
            });

            let data = null;
            try {
                if (response.status !== 200) {
                    throw new Error("An error occurred while fetching the data. Please try again later.");
                }
                data = await response.json();
            } catch (e) {
                scores_container.innerHTML = "An error occurred while fetching the data. Please try again later.";
                return;
            }

            scores_container.appendChild(createPagination(page, `/rankings/osu/${active_custom_ranking.api_path}`));

            const ranking_page = document.createElement("div");
            ranking_page.classList.add("ranking-page");
            scores_container.appendChild(ranking_page);

            const ranking_table = document.createElement("table");
            ranking_table.classList.add("ranking-page-table");
            ranking_page.appendChild(ranking_table);

            const ranking_thead = document.createElement("thead");
            ranking_table.appendChild(ranking_thead);

            ranking_thead.appendChild(createTableHeaderItem());
            ranking_thead.appendChild(createTableHeaderItem());

            for (let attr of active_custom_ranking.attributes) {
                ranking_thead.appendChild(createTableHeaderItem(attr[0].name, attr[1] ?? false));
            }

            const ranking_tbody = document.createElement("tbody");
            ranking_table.appendChild(ranking_tbody);

            const _addTableBodyRow = (data, i) => {
                const tr = document.createElement("tr");
                tr.classList.add("ranking-page-table__row");

                const td_rank = document.createElement("td");
                td_rank.classList.add("ranking-page-table__column", "ranking-page-table__rank");
                td_rank.textContent = `#${i + 1 + (page - 1) * 50}`;
                tr.appendChild(td_rank);

                const td_user = document.createElement("td");
                td_user.classList.add("ranking-page-table__column", "ranking-page-table__user");
                const userLinkParent = document.createElement("div");
                userLinkParent.classList.add("ranking-page-table__user-link");

                const flagsSpan = document.createElement("span");
                flagsSpan.classList.add("ranking-page-table__flags");

                const countryLink = document.createElement("a");
                countryLink.href = `/rankings/osu/performance?country=${data.country_code}`;
                countryLink.classList.add("u-contents");

                const countryLinkSpan = document.createElement("span");
                countryLinkSpan.classList.add("flag-country");
                countryLinkSpan.style.backgroundImage = `url(https://flagpedia.net/data/flags/h24/${data.country_code.toLowerCase()}.webp)`;
                countryLinkSpan.setAttribute("title", data.country_name);
                countryLink.appendChild(countryLinkSpan);
                flagsSpan.appendChild(countryLink);

                if (data.team) {
                    const teamLink = document.createElement("a");
                    teamLink.href = `https://osu.ppy.sh/teams/${data.team.id}`;
                    teamLink.classList.add("u-contents");

                    const teamLinkSpan = document.createElement("span");
                    teamLinkSpan.classList.add("flag-team");
                    teamLinkSpan.style.backgroundImage = `url(${data.team.flag_url})`;
                    teamLinkSpan.setAttribute("title", data.team.name);
                    teamLink.appendChild(teamLinkSpan);
                    flagsSpan.appendChild(teamLink);
                }

                userLinkParent.appendChild(flagsSpan);

                const userLink = document.createElement("a");
                userLink.classList.add("ranking-page-table__user-link-text", "js-usercard");
                userLink.href = `/users/${data.user_id}`;
                userLink.textContent = data.username;
                userLink.setAttribute("data-user-id", data.user_id);
                userLinkParent.appendChild(userLink);
                td_user.appendChild(userLinkParent);
                tr.appendChild(td_user);

                for (let attr of active_custom_ranking.attributes) {
                    const formatter = attr[0].formatter ?? ((val) => val.toLocaleString());
                    const td = document.createElement("td");
                    td.classList.add("ranking-page-table__column");
                    if (!attr[1]) {
                        td.classList.add("ranking-page-table__column--dimmed");
                    }
                    td.textContent = formatter(attr[0].val(data));
                    if (attr[0].tooltip_formatter) {
                        td.setAttribute("data-html-title", attr[0].tooltip_formatter(Number(attr[0].val(data) ?? 0)));
                        td.setAttribute("title", "");
                    }
                    tr.appendChild(td);
                }

                return tr;
            }

            data.forEach((d, i) => {
                ranking_tbody.appendChild(_addTableBodyRow(d, i));
            });

            //another pagination at the bottom
            scores_container.appendChild(createPagination(page, `/rankings/osu/${active_custom_ranking.api_path}`));

            // find 'a' with data-menu-target = "nav2-menu-popup-rankings"
            let nav2_menu_link_bar = document.querySelector('a[data-menu-target="nav2-menu-popup-rankings"]');
            //get child span
            let nav2_menu_link_bar_span = nav2_menu_link_bar.querySelector("span");

            //add a span with class "nav2__menu-link-bar u-section--bg-normal"
            let nav2_menu_link_bar_span_new = document.createElement("span");
            nav2_menu_link_bar_span_new.classList.add("nav2__menu-link-bar", "u-section--bg-normal");
            nav2_menu_link_bar_span.appendChild(nav2_menu_link_bar_span_new);
        }

        // const active_ranking = lb_page_nav_items.find(item => item.link.replace("{mode}", mode) === url);
        const active_ranking = lb_page_nav_items.find(item => {
            //some links may have "/*" at the end, in that case, we need to check if the url starts with the link instead of checking for equality
            if (item.link.includes("/.*")) {
                return url.startsWith(item.link.replace("{mode}", mode).replace("/.*", ""));
            }

            return item.link.replace("{mode}", mode) === url;
        });
        //empty the header nav
        createRankingNavigation({
            nav: headerNav,
            items: lb_page_nav_items,
            mode: mode,
            // active: active_custom_ranking ? active_custom_ranking.api_path : null
            active: active_ranking ? active_ranking.attr : null
        });

        //if we are on daily-challenge page
        if (window.location.href.includes("/rankings/daily-challenge")) {
            //wait 0.5s for the page to load
            await new Promise(r => setTimeout(r, 1000));
            //we need to patch out issue from subdivide nations extension
            //get all elements with class "ranking-page-table__user-link" under "ranking-page-table"
            const userLinks = document.getElementsByClassName("ranking-page-table__user-link");

            //loop through all userLinks
            for (let i = 0; i < userLinks.length; i++) {
                //check if we have 2 divs with style "display: inline-block"
                //if we do, this row is affected by subdivide nations extension

                //if we have 2 divs with style "display: inline-block"
                if (userLinks[i].children[0].style.display === "inline-block" && userLinks[i].children[1].style.display === "inline-block") {
                    //move the first span of the second div to the first div as 2nd child
                    userLinks[i].children[0].appendChild(userLinks[i].children[1].children[0]);

                    //move 2nd child of first div, to the back of the first div
                    userLinks[i].children[0].appendChild(userLinks[i].children[0].children[1]);

                    //remove the second div
                    userLinks[i].removeChild(userLinks[i].children[1]);

                    //move all children of the first div to the parent div and remove the first div
                    while (userLinks[i].children[0].children.length > 0) {
                        userLinks[i].appendChild(userLinks[i].children[0].children[0]);
                    }

                    userLinks[i].removeChild(userLinks[i].children[0]);
                }
            }
        }
    }

    async function runScoreRankChanges() {
        //url has to match: "/rankings/{mode}/score{?page=1}"
        const _url = window.location.href;
        const mode = _url.match(/\/rankings\/(osu|taiko|fruits|mania)\/score/)?.[1];
        if (!mode) {
            return;
        }

        //if contains ?filter=friends, do not run
        if (_url.includes("?filter=friends")) {
            return;
        }

        const mode_id = MODE_SLUGS_ALT.indexOf(mode);
        if (mode_id === -1) {
            return;
        }

        await WaitForElement('.ranking-page-table');

        const table = document.getElementsByClassName('ranking-page-table')[0];
        const thead = table.getElementsByTagName('thead')[0];
        const tbody = table.getElementsByTagName('tbody')[0];
        const rows = tbody.getElementsByTagName('tr');
        const headerRow = thead.getElementsByTagName('tr')[0];

        const headerCells = headerRow.getElementsByTagName('th');

        const RANK_INDEX = 0;
        const USER_INDEX = 1;
        const RANK_CHANGE_INDEX = 1; //this gets inserted at index 1
        const SCORE_INDEX = 5;
        const SCORE_CHANGE_INDEX = 8;

        let rank_change_date = null;

        //change all rows to completion percentage (first do a dash, then do the percentage when the data is loaded)
        let ids = [];
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.getElementsByTagName('td');

            //get the user id from the data-user-id attribute
            //from column 1, get the the first child element with class 'js-usercard' in it, then get the data-user-id attribute
            const user_id = cells[USER_INDEX].getElementsByClassName('js-usercard')[0].getAttribute('data-user-id');
            ids.push(user_id);
        }

        //get data
        //post with user_ids
        const result = await fetch(`${SCORE_INSPECTOR_API}extension/score_rank_history/${mode_id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ids: ids })
        });

        const data = await result.json();

        if (!data || data.error) {
            console.error(data.error);
            return;
        }

        const getRankChangeIcon = (change) => {
            const td = document.createElement('td');

            //ranking-page-table__column ranking-page-table__column--rank-change-icon ranking-page-table__column--rank-change-none
            td.classList.add('ranking-page-table__column', 'ranking-page-table__column--rank-change-icon');
            if (change === 0) {
                td.classList.add('ranking-page-table__column--rank-change-none');
            } else if (change > 0) {
                td.classList.add('ranking-page-table__column--rank-change-up');
            } else {
                td.classList.add('ranking-page-table__column--rank-change-down');
            }

            return td;
        }

        const getRankChangeText = (change, format = false) => {
            const td = document.createElement('td');

            //ranking-page-table__column ranking-page-table__column--rank-change-value ranking-page-table__column--rank-change-none
            td.classList.add('ranking-page-table__column', 'ranking-page-table__column--rank-change-value');

            if (change === 0) {
                td.classList.add('ranking-page-table__column--rank-change-none');
            } else if (change > 0) {
                td.classList.add('ranking-page-table__column--rank-change-up');
            } else {
                td.classList.add('ranking-page-table__column--rank-change-down');
            }

            if (change !== 0) {
                if (format) {
                    td.textContent = formatNumberAsSize(change);
                    td.title = change.toLocaleString();
                } else {
                    td.textContent = Math.abs(change);
                }
            }

            return td;
        }

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.getElementsByTagName('td');
            const user_id = cells[USER_INDEX].getElementsByClassName('js-usercard')[0].getAttribute('data-user-id');
            const current_rank_str = cells[RANK_INDEX].textContent; //"#1", "#2", etc
            const current_rank = parseInt(current_rank_str.trim().slice(1)); //remove the "#" and parse to int

            //get title
            const current_score_str = cells[SCORE_INDEX].children[0].getAttribute('title');
            const current_score = Number(current_score_str.replace(/,/g, ''));

            const rank_change_data = data.find(d => d.osu_id == user_id);
            let change_rank = 0;
            let change_score = 0;

            if (rank_change_data) {
                let old_rank = parseInt(rank_change_data.old_rank);
                let old_score = parseInt(rank_change_data.old_ranked_score);
                change_rank = old_rank - current_rank;
                change_score = current_score - old_score;

                if (!rank_change_date) {
                    rank_change_date = rank_change_data.date;
                }
            }

            const rank_change_text = getRankChangeText(change_rank);
            row.insertBefore(rank_change_text, cells[RANK_CHANGE_INDEX]);

            const rank_change_icon = getRankChangeIcon(change_rank);
            row.insertBefore(rank_change_icon, cells[RANK_CHANGE_INDEX]);

            //human readable score change
            const score_change_text = getRankChangeText(change_score, true);
            row.insertBefore(score_change_text, cells[SCORE_CHANGE_INDEX]);

            const score_change_icon = getRankChangeIcon(change_score);
            row.insertBefore(score_change_icon, cells[SCORE_CHANGE_INDEX]);
        }

        //insert empty header cells for rank change at RANK_CHANGE_INDEX
        headerRow.insertBefore(document.createElement('th'), headerCells[RANK_CHANGE_INDEX]);
        headerRow.insertBefore(document.createElement('th'), headerCells[RANK_CHANGE_INDEX]);

        //insert empty header cells for score change at SCORE_CHANGE_INDEX
        headerRow.insertBefore(document.createElement('th'), headerCells[SCORE_CHANGE_INDEX]);
        headerRow.insertBefore(document.createElement('th'), headerCells[SCORE_CHANGE_INDEX]);

        if (rank_change_date) {
            //get the 2nd pagination
            const pagination = document.getElementsByClassName("pagination-v2")[1];

            //below this, add a text that tells us from what date the score difference is from
            const dateText = document.createElement("div");
            dateText.classList.add("ranking-page-table__date");
            dateText.textContent = `Rank changes are from ${rank_change_date}`;
            pagination.parentNode.insertBefore(dateText, pagination);
        }
    }

    //replaces the accuracy column with a completion percentage column
    async function runScoreRankCompletionPercentages() {
        try {
            //check if we are on "/rankings/osu/score" page
            const _url = window.location.href;
            if (!_url.includes("/rankings/osu/score")) {
                return;
            }

            //wait for class 'ranking-page-table' to load
            await WaitForElement('.ranking-page-table');

            //get all the rows in the table
            //rows are in the tbody of the table
            const table = document.getElementsByClassName('ranking-page-table')[0];
            const thead = table.getElementsByTagName('thead')[0];
            const tbody = table.getElementsByTagName('tbody')[0];
            const rows = tbody.getElementsByTagName('tr');
            const headerRow = thead.getElementsByTagName('tr')[0];

            //accuracy row is index 2
            const USER_INDEX = 1;
            const ACCURACY_INDEX = 2;

            //change header to "Completion"
            const headerCells = headerRow.getElementsByTagName('th');
            headerCells[ACCURACY_INDEX].textContent = "Completion";

            //change all rows to completion percentage (first do a dash, then do the percentage when the data is loaded)
            let ids = [];
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const cells = row.getElementsByTagName('td');
                cells[ACCURACY_INDEX].textContent = "-";

                //get the user id from the data-user-id attribute
                //from column 1, get the the first child element with class 'js-usercard' in it, then get the data-user-id attribute
                const user_id = cells[USER_INDEX].getElementsByClassName('js-usercard')[0].getAttribute('data-user-id');
                ids.push(user_id);
            }

            //comma separated string
            const id_string = ids.join(',');

            const url = `${SCORE_INSPECTOR_API}users/stats/completion_percentage/${id_string}`;
            const response = await fetch(url, {
                headers: {
                    "Access-Control-Allow-Origin": "*"
                },
                signal: AbortSignal.timeout(5000)
            });


            const data = await response.json();

            if (data.error) {
                console.error(data.error);
                return;
            }

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const cells = row.getElementsByTagName('td');
                const user_id = cells[USER_INDEX].getElementsByClassName('js-usercard')[0].getAttribute('data-user-id');
                let completion_percentage = data.find(d => d.user_id == user_id)?.completion ?? "-";
                if (completion_percentage !== "-") {
                    //cap it at 100%, used profile stats for SS,S,A, which may be different from osu!alt
                    completion_percentage = Math.min(completion_percentage, 100);
                    completion_percentage = completion_percentage.toFixed(2);
                }

                //round to 2 decimal places
                cells[ACCURACY_INDEX].textContent = `${completion_percentage}%`;
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function runUserPage() {
        const url = window.location.href;
        let fixedUrl = url.endsWith("/") ? url.slice(0, -1) : url;
        let user_id = null;
        try {
            user_id = fixedUrl.match(/\/users\/(\d+)/)[1];
        } catch (e) { }
        if (!user_id) {
            return;
        }

        let mode = fixedUrl.match(/\/users\/\d+\/(osu|taiko|fruits|mania)/);
        mode = mode ? mode[1] : "osu";

        //wait for game-mode-link--active to load
        await WaitForElement(".game-mode-link--active");

        const activeModeElement = document.getElementsByClassName("game-mode-link game-mode-link--active")[0];
        if (activeModeElement) {
            mode = activeModeElement.getAttribute("data-mode");
        }

        await WaitForElement(PAGE_ELEMENT_WAIT_LIST.user_page);

        //get username (first span element in profile-info__name)
        const username = document.getElementsByClassName("profile-info__name")[0].getElementsByTagName("span")[0].textContent;

        const data = await getUserData(user_id, username, mode);

        const user_exists = data.user != null &&
            (typeof data.coe !== "undefined" || typeof data.coe.error !== "string")

        if (data.coe && !data.coe.error) {
            setOrCreateCoeBannerElement(data.coe);
        }

        if (data.team) {
            setOrCreateUserTeamTagElement(data.team);
            setOrCreateTeamBannerElement(data.team);
        }

        if (data.completion) {
            setCompletionistBadges(data.completion);
        }

        //if theres more than just .coe
        if (data && Object.keys(data).length > 1) {
            setNewRankGraph(data.scoreRankHistory, data.stats?.scoreRank, user_exists);

            //if the user does not exist, give informational alert.
            if (!user_exists) {
                if (mode === "osu") {
                    //we only show the popup for osu! mode, other modes are not supported period.
                    popup("No osu!alt statistics available for this user.");
                }
                //skip other checks as redundant
                return;
            }
            setOrCreateStatisticsElements(data);
        }
    }

    function setOrCreateUserTeamTagElement(team) {
        var userTagElement = document.getElementById("inspector_user_tag");
        var userTagParent = null;

        if (!userTagElement) {
            var profileNameParentNode = document.getElementsByClassName("profile-info__name")[0];
            userTagElement = profileNameParentNode.childNodes[0].cloneNode(true);
            userTagElement.id = "inspector_user_tag";

            var div = document.createElement("a");
            div.style.display = "inline";
            div.style.textDecoration = "none";
            div.appendChild(userTagElement);

            userTagParent = div;
            profileNameParentNode.insertBefore(div, profileNameParentNode.childNodes[0]);
        } else {
            userTagParent = userTagElement.parentNode;
        }

        userTagElement.textContent = `[${team.short_name}]`;
        userTagElement.style.color = `${team.color}`;
        userTagElement.style.marginRight = "5px";
        userTagElement.style.fontWeight = "bold";

        userTagParent.setAttribute("data-title", `<div>${team.name}</div>`);
        userTagParent.setAttribute("title", "");
        userTagParent.href = `https://osu.ppy.sh/teams/${team.id}`;
        userTagParent.target = "_blank";
    }

    async function WaitForElement(selector, timeout = 5000) {
        const startTime = new Date().getTime();
        while (document.querySelectorAll(selector).length == 0) {
            if (new Date().getTime() - startTime > timeout) {
                return null;
            }
            await new Promise(r => setTimeout(r, 100));
        }
    }

    async function getUserData(user_id, username, mode = "osu") {
        const modeIndex = MODE_SLUGS_ALT.indexOf(mode);
        let user_data = null;
        try {
            const _user_data = await fetch(`${SCORE_INSPECTOR_API}extension/profile`, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json"
                },
                method: "POST",
                body: JSON.stringify({
                    user_id: user_id,
                    mode: modeIndex,
                    username: username
                })
            });
            user_data = await _user_data.json();

            if (!user_data || user_data.error) {
                user_data = {};
            }

            //get COE data
            const coe_data = await fetch(`${SCORE_INSPECTOR_API}extension/coe/${user_id}`);
            user_data.coe = await coe_data.json();

            if (!user_data.coe.error) {
                //capitalize first letter of each word in the roles
                user_data.coe.user.roles = user_data.coe.user.roles.map(role => role.replace(/\b\w/g, l => l.toUpperCase()));

                //if affiliate is not null, add "Affiliate" to the roles
                if (user_data.coe.user.affiliate) {
                    user_data.coe.user.roles.push("Affiliate");
                }
            }

            return user_data;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    function setCompletionistBadges(badge_data) {
        if (!badge_data || badge_data.length === 0) {
            return;
        }

        //check if we have a badge area already (class "profile-badges"), otherwise create it
        var badgeArea = document.getElementsByClassName("profile-badges")[0];

        if (!badgeArea) {
            badgeArea = document.createElement("div");
            badgeArea.className = "profile-badges";

            //insert it before "profile-detail"
            const profileDetail = document.getElementsByClassName("profile-detail")[0];
            profileDetail.parentNode.insertBefore(badgeArea, profileDetail);
        }

        //order newest to oldest
        badge_data.sort((a, b) => new Date(b.completion_date) - new Date(a.completion_date));

        //create a badge for each completionist badge
        badge_data.forEach(badge => {
            if (badgeArea.querySelector(`img[src='https://assets.ppy.sh/profile-badges/completionist_${MODE_SLUGS[badge.mode]}.png']`)) {
                return;
            }

            var a = document.createElement("a");
            a.href = `https://score.kirino.sh/completionists`;

            badgeArea.appendChild(a);

            const pretty_date = new Date(badge.completion_date).toLocaleDateString("en-GB", {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            var img = document.createElement("img");
            // img.src = MODE_COMPLETION_BADGES[badge.mode];
            img.src = `https://assets.ppy.sh/profile-badges/completionist_${MODE_SLUGS[badge.mode]}.png`;
            img.className = "profile-badges__badge";
            a.setAttribute("data-html-title", `
                    <div>${MODE_NAMES[badge.mode]} completionist (awarded ${badge.completion_date})</div>
                    <div>Scores: ${badge.scores.toLocaleString()}</div>
                    <div class='profile-badges__date'>${pretty_date}</div>
                `);

            a.title = `${MODE_NAMES[badge.mode]} completionist (awarded ${pretty_date})`

            a.appendChild(img);
        });

        const badges = Array.from(badgeArea.children);
        if (badges && badges.length > 1) {
            for (let i = badges.length - 1; i > 0; i--) {
                const current = badges[i];
                const previous = badges[i - 1];

                //find both 'data-html-title' attributes in the current and next tree, may be on the element or any child element
                let current_data_html_title = searchElementForAttribute(current, "data-html-title");
                let previous_data_html_title = searchElementForAttribute(previous, "data-html-title");

                //find profile-badges__date
                const dateCurrent = current_data_html_title.match(/<div class='profile-badges__date'>(.*?)<\/div>/)[1] ?? "";
                const datePrevious = previous_data_html_title.match(/<div class='profile-badges__date'>(.*?)<\/div>/)[1] ?? "";

                //if previous is older than current, swap them
                if (new Date(datePrevious) < new Date(dateCurrent)) {
                    badgeArea.insertBefore(current, previous);
                }
            }
        }
    }

    function setOrCreateStatisticsElements(data) {
        //element with "profile-rank-count" class is the parent of the rank elements
        //every rank is an div element, that div has a child with the class "profile-rank--XH", "profile-rank--X", "profile-rank--SH", "profile-rank--S", "profile-rank--A"

        //we follow the structure to add B, C and D ranks
        var parent = document.getElementsByClassName("profile-rank-count")[0];

        //create the elements if they don't exist
        const ranks = ["B", "C", "D"];
        ranks.forEach(rank => {
            //if element exists, delete it
            if (document.getElementById(`inspector_elm_${rank.toLowerCase()}`)) {
                document.getElementById(`inspector_elm_${rank.toLowerCase()}`).remove();
            }

            var b = document.createElement("div");
            b.id = `inspector_elm_${rank.toLowerCase()}`;
            var div = document.createElement("div");
            div.className = `score-rank score-rank--${rank} score-rank--profile-page`;
            b.appendChild(div);
            let rankText = null;
            if (data.user?.[`${rank.toLowerCase()}_count`] !== undefined && !isNaN(data.user?.[`${rank.toLowerCase()}_count`])) {
                rankText = document.createTextNode(Number(data.user?.[`${rank.toLowerCase()}_count`]).toLocaleString());
            } else {
                rankText = document.createTextNode('-');

                //add a tooltip to explain the rank is not available
                b.setAttribute("data-html-title", `<div>Data not available</div>`);
                b.setAttribute("title", "");
            }
            b.appendChild(rankText);
            parent.appendChild(b);
        });

        //for all XH, X, SH, S, A ranks, we set a tooltip display alt values
        ["XH", "X", "SH", "S", "A"].forEach(rank => {
            var rankElement = document.getElementsByClassName(`score-rank--${rank}`)[0];
            if (rankElement) {
                let _rank = rank.toLowerCase();
                if (_rank === 'xh') _rank = 'ssh';
                if (_rank === 'x') _rank = 'ss';
                let val = Number(data.user?.[`alt_${_rank}_count`]).toLocaleString();
                if (isNaN(Number(data.user?.[`alt_${_rank}_count`]))) val = 'Data not available';
                rankElement.setAttribute("data-html-title", `
                    osu!alt: ${val}
                    `);
                rankElement.setAttribute("title", "");
            }
        });

        //find the parent of score-rank--A
        var aParent = document.getElementsByClassName("score-rank--A")[0].parentNode;

        //add an element before aParent to force the next elements to be on the next line
        var br = document.createElement("div");
        //flex expand
        br.style.flexBasis = "100%";
        aParent.parentNode.insertBefore(br, aParent);

        //align all the elements to the right
        parent.style.justifyContent = "flex-end";

        //grades done
        const profile_detail__rank = document.getElementsByClassName("profile-detail__values")[0];
        let profile_stat_index = 2;
        //if class daily-challenge exists, index is 2
        // if (document.getElementsByClassName("daily-challenge").length > 0) {
        //     profile_stat_index = 2;
        // }
        const profile_detail__values = document.getElementsByClassName("profile-detail__values")[profile_stat_index];

        profile_detail__rank.style.gap = "8px";

        const clears = data.user ? (
            data.user.alt_ssh_count +
            data.user.alt_ss_count +
            data.user.alt_sh_count +
            data.user.alt_s_count +
            data.user.alt_a_count +
            data.user.b_count + data.user.c_count + data.user.d_count) : 'NaN';
        const profile_clears = data.user ? (data.user.ssh_count + data.user.ss_count + data.user.sh_count + data.user.s_count + data.user.a_count) : 'NaN';
        var clearsDisplay = getValueDisplay("inspector_elm_clears", "Clears", clears ? Number(clears).toLocaleString() : null, false, `Profile clears: ${Number(profile_clears).toLocaleString()}`);
        if (document.getElementById("inspector_elm_clears")) { document.getElementById("inspector_elm_clears").remove(); }
        profile_detail__values.appendChild(clearsDisplay);

        var completionDisplay = getValueDisplay("inspector_elm_completion", "Completion", !isNaN(clears) ? `${(data.user?.completion ?? 0).toFixed(2)}%` : "NaN");
        if (document.getElementById("inspector_elm_completion")) { document.getElementById("inspector_elm_completion").remove(); }
        profile_detail__values.appendChild(completionDisplay);

        var top50sDisplay = getValueDisplay("inspector_elm_top50s", "Top 50s", Number(data.stats?.top50s ?? 0).toLocaleString());
        if (document.getElementById("inspector_elm_top50s")) { document.getElementById("inspector_elm_top50s").remove(); }
        profile_detail__values.appendChild(top50sDisplay);

        var globalSSrankDisplay = getValueDisplay("inspector_elm_ss_rank", "SS Ranking", Number(data.user?.global_ss_rank).toLocaleString(), true, `Highest rank: #${Number(data.user?.global_ss_rank_highest ?? 0).toLocaleString()} on ${data.user?.global_ss_rank_highest_date ? new Date(data.user?.global_ss_rank_highest_date).toLocaleDateString("en-GB", {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }) : "N/A"
            }`);
        if (document.getElementById("inspector_elm_ss_rank")) { document.getElementById("inspector_elm_ss_rank").remove(); }
        profile_detail__rank.appendChild(globalSSrankDisplay);

        var countrySSrankDisplay = getValueDisplay("inspector_elm_ss_c_rank", "Country SS Ranking", Number(data.user?.country_ss_rank).toLocaleString(), true, `Highest rank: #${Number(data.user?.country_ss_rank_highest ?? 0).toLocaleString()} on ${data.user?.country_ss_rank_highest_date ? new Date(data.user?.country_ss_rank_highest_date).toLocaleDateString("en-GB", {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }) : "N/A"
            }`);
        if (document.getElementById("inspector_elm_ss_c_rank")) { document.getElementById("inspector_elm_ss_c_rank").remove(); }
        profile_detail__rank.appendChild(countrySSrankDisplay);

        profile_detail__values.style.rowGap = "5px";

        //find element with class "profile-detail__chart-numbers profile-detail__chart-numbers--top"
        var chartNumbers = document.getElementsByClassName("profile-detail__chart-numbers profile-detail__chart-numbers--top")[0];
        var profileDetails = document.getElementsByClassName("profile-detail")[0];
        profileDetails.insertBefore(chartNumbers, profileDetails.childNodes[0]);
    }

    function getValueDisplay(id, label, value, is_rank = false, tooltip = null) {
        var div = document.createElement("div");
        div.id = id;
        div.className = `value-display value-display--${is_rank ? 'rank' : 'plain'}`;
        var labelDiv = document.createElement("div");
        labelDiv.className = "value-display__label";
        labelDiv.textContent = label;
        div.appendChild(labelDiv);
        var valueDiv = document.createElement("div");
        valueDiv.className = "value-display__value";
        if (value === 'NaN') {
            valueDiv.textContent = `-`;
            div.setAttribute("data-html-title", `<div>Data not available</div>`);
            div.setAttribute("title", "");
        } else {
            valueDiv.textContent = `${is_rank ? '#' : ''}${value}`;
            if (tooltip) {
                valueDiv.setAttribute("data-html-title", `<div>${tooltip}</div>`);
                valueDiv.setAttribute("title", "");
            }
        }
        div.appendChild(valueDiv);
        return div;
    }

    function getBannerIndex() {
        const mainElement = document.querySelector("[data-page-id='main']");
        const coverIndex = Array.from(mainElement.children).findIndex(child => child.classList.contains("profile-cover"));
        return { mainElement, coverIndex };
    }

    function setOrCreateTeamBannerElement(team) {
        const { mainElement, coverIndex } = getBannerIndex();

        var teamBanner = document.getElementById("inspector_team_banner");
        if (teamBanner) {
            //remove it and re-add it
            teamBanner.remove();
        }
        teamBanner = getBaseBannerElement("inspector_team_banner", team.header_url ?? IMAGE_DEFAULT_TEAM_BG, true);

        var rawHtml = `
            <div style="display: flex; align-items: center; height: 100%;">
                <div style="display: flex; flex-direction: row; justify-content: center;">
                    <div style="display: flex; flex-direction: column; justify-content: center; margin-right: 1rem;">
                        <p style="margin-bottom: 0px; font-size: 22px; color: white;">
                            <i class="fas fa-users"></i>
                        </p>
                    </div>
                    <div style="display: flex; flex-direction: column; justify-content: center;">
                        <p style="margin-bottom: 0px; font-size: 22px;">Member of <a href="https://osu.ppy.sh/teams/${team.id}" target="_blank"><span id="inspector_user_clan_tag" style='color:${team.color}'></span> <span id="inspector_user_clan_name"></span></a></p>
                    </div>
                </div>
            </div>
        `;

        var overlay = teamBanner.querySelector("#inspector_user_banner_overlay");
        overlay.innerHTML = rawHtml;

        var clanTagElement = overlay.querySelector("#inspector_user_clan_tag");
        clanTagElement.innerText = `[${team.short_name}]`;

        var clanNameElement = overlay.querySelector("#inspector_user_clan_name");
        clanNameElement.innerText = team.name;

        mainElement.insertBefore(teamBanner, mainElement.children[coverIndex + 2]);
    }

    function setOrCreateCoeBannerElement(coe) {
        const { mainElement, coverIndex } = getBannerIndex();

        var coeBanner = document.getElementById("inspector_coe_banner");
        if (coeBanner) {
            //remove it and re-add it
            coeBanner.remove();
        }
        coeBanner = getBaseBannerElement("inspector_coe_banner", "https://kirino.sh/d/coe_bg.png", false);

        // var coeTag = document.createElement("div");
        // coeTag.style.color = "white";
        // coeTag.style.fontWeight = "light";
        // coeTag.style.fontSize = "20px";
        // coeTag.innerHTML = `<p style="margin-bottom: 0px;">COE Attendee</p>`;
        var overlay = coeBanner.querySelector("#inspector_user_banner_overlay");
        // overlay.appendChild(coeTag);

        //coe logo on the left, followed by text
        //logo: https://kirino.sh/d/coe_logo.png (automatic width, full height)
        //text: COE Attendee above, temp text under it
        var rawHtml = `
            <div style="display: flex; align-items: center; height: 100%;">
                <a href="https://cavoeboy.com/" target="_blank" style="display: flex; align-items: center; height: 100%;">
                    <img src="https://kirino.sh/d/coe_logo.svg" style="height: 55%; margin-right: 10px;">
                </a>
                <div style="display: flex; flex-direction: column; justify-content: center;">
                    <p style="margin-bottom: 0px; font-size: 18px;">Attendee${coe.user.roles?.length > 0 ? " / " + coe.user.roles.join(" / ") : ""}</p>
                    <p style="margin-bottom: 0px; font-size: 12px;">${COE_ATTENDEE_TYPES[coe.ticketType] ?? "Unknown Ticket Type"}</p>
                </div>
            </div>
        `;
        overlay.innerHTML = rawHtml;

        //insert it after the cover
        mainElement.insertBefore(coeBanner, mainElement.children[coverIndex + 2]);
    }

    function getBaseBannerElement(id, image, overlay_tint = true) {
        var banner = document.createElement("div");
        banner.id = id;

        banner.style.width = "100%";
        banner.style.height = "60px";

        if (image) {
            const parsed_image = new URL(image);
            banner.style.backgroundImage = `url(${parsed_image})`;
            banner.style.backgroundSize = "cover";
            banner.style.backgroundPosition = "center";
        }

        var overlay = document.createElement("div");
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = `rgba(0, 0, 0, ${overlay_tint ? 0.7 : 0})`;
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "left";
        overlay.style.paddingLeft = "50px";
        overlay.id = "inspector_user_banner_overlay";
        banner.appendChild(overlay);

        return banner;
    }

    let activeChart = 'pp';
    let ppRankData = null;
    let scoreRankData = null;
    let graphHue = 0;
    function setNewRankGraph(score_rank_history, current_rank, reorder_elements) {
        const TODAY = new Date();

        const cloned_rank_history = [...score_rank_history ?? []];
        if (current_rank) {
            cloned_rank_history.push({
                ...cloned_rank_history[cloned_rank_history.length - 1],
                //date as YYYY-MM-DD
                date: new Date().toISOString().split('T')[0],
                rank: current_rank
            });
        }

        const layout = document.getElementsByClassName("js-react--profile-page u-contents")[0];
        const data = layout.getAttribute("data-initial-data");
        const parsedData = JSON.parse(data);
        graphHue = parsedData.user.profile_hue;
        const rankHistory = parsedData.user.rank_history.data ?? parsedData.user.rankHistory.data ?? [];

        //generate data for pp rank (array is a simple number array [0,5,25,7763,...] sorted oldest to newest, 89d ago to today, convert it to object array {date,rank})
        const pp_ranks_filled = [];
        rankHistory.reverse().forEach((rank, i) => {
            const date = new Date(TODAY - (1000 * 60 * 60 * 24) * i);
            pp_ranks_filled.push({ date, rank });
        });

        ppRankData = pp_ranks_filled;

        //if no pp rank data, or last pp rank is 0, then return;
        if (!ppRankData || ppRankData.length === 0 || ppRankData[0].rank === 0) {
            return;
        }

        scoreRankData = (cloned_rank_history && cloned_rank_history.length > 2) ? cloned_rank_history : null;

        //find with class "line-chart line-chart--profile-page"
        const lineChart = document.getElementsByClassName("profile-detail__chart")[0];
        if (lineChart) {
            const chartParent = lineChart.parentNode;
            lineChart.remove();

            //create chart context
            const chartOwner = document.createElement("div");
            const chart = document.createElement("canvas");
            chart.id = "custom_rank_chart";

            chartOwner.appendChild(chart);
            chartOwner.style.width = "100%";
            chartOwner.style.height = "90px";
            chartOwner.style.marginTop = "10px";
            chartOwner.style.marginBottom = "30px";

            const getRankSet = (graph) => {
                switch (graph) {
                    case "Performance":
                        return ppRankData;
                    case "Score":
                        return scoreRankData;
                }
            }

            const toggleLink = document.createElement("div");
            const updateLinks = () => {
                //remove all children
                while (toggleLink.firstChild) {
                    toggleLink.removeChild(toggleLink.firstChild);
                }
                if (!scoreRankData || scoreRankData.length === 0) {
                    CURRENT_GRAPH = "Performance";
                }
                GRAPHS.forEach(graph => {

                    const graphData = getRankSet(graph);
                    let span = document.createElement(CURRENT_GRAPH === graph ? "span" : "a");
                    // span.style.color = CURRENT_GRAPH !== graph ? "#fc2" : "white";
                    span.style.color = CURRENT_GRAPH !== graph ? (graphHue ? `hsl(${graphHue}, 40%, 80%)` : "#fc2") : "white";
                    if (CURRENT_GRAPH !== graph) {
                        span.href = "javascript:void(0)";
                        span.style.textDecoration = "underline";
                        if (graphData) {
                            span.onclick = () => {
                                updateGraph(graphData, graph);
                                CURRENT_GRAPH = graph;
                                GM_setValue("inspector_current_graph", CURRENT_GRAPH);
                                updateLinks();
                            }
                        } else {
                            //disable link cursor when hover
                            span.style.cursor = "default";
                            //add a tooltip to explain the rank is not available
                            span.setAttribute("data-html-title", `<div>Data not available</div>`);
                            span.setAttribute("title", "");
                            //strike through
                            span.style.textDecoration = "line-through";
                        }
                    }
                    span.style.fontSize = "12px";
                    span.style.marginRight = "5px";
                    span.textContent = graph;
                    toggleLink.appendChild(span);
                });
            }
            updateLinks();

            chartParent.insertBefore(chartOwner, chartParent.children[reorder_elements ? 0 : 1]);
            //insert the toggle after the chart
            chartParent.insertBefore(toggleLink, chartParent.children[reorder_elements ? 1 : 2]);

            //completely REMOVES the link if there is no score rank data
            // if (!scoreRankData || scoreRankData.length === 0) {
            //     toggleLink.remove();
            // }

        }

        if (scoreRankData && scoreRankData.length > 0) {
            switch (CURRENT_GRAPH) {
                case "Performance":
                    updateGraph(ppRankData, "PP Rank");
                    break;
                case "Score":
                    updateGraph(scoreRankData, "Score Rank");
                    break;
            }
        } else {
            updateGraph(ppRankData, "PP Rank");
        }
    }

    let _chart = null;
    let _chart_data = null;
    function updateGraph(rank_data, rank_type) {
        let ctx = document.getElementById("custom_rank_chart");
        //destroy previous chart
        if (ctx) {
            let _clone = ctx.cloneNode(true);
            ctx.parentNode.replaceChild(_clone, ctx);
            ctx = _clone;
        }

        const data = {
            type: 'line',
            data: {
                labels: rank_data.map(data => data.date),
                datasets: [{
                    label: rank_type,
                    data: rank_data.map(data => data.rank),
                    // borderColor: '#fc2',
                    borderColor: graphHue ? `hsl(${graphHue}, 50%, 45%)` : '#fc2',
                    tension: 0.1,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day'
                        },
                        display: false,
                        grace: '10%',
                        offset: true
                    },
                    y: {
                        reverse: true,
                        display: false,
                        grace: '10%'
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false,
                        position: 'nearest',
                        external: externalTooltipHandler,
                        callbacks: {
                            title: function (context) {
                                // return context[0].raw;
                                // return new Date(context[0].parsed.x).toLocaleDateString();
                                //show days ago / today
                                const date = context[0].parsed.x;
                                const today = new Date();
                                const days = Math.floor((today - date) / (1000 * 60 * 60 * 24));
                                if (days === 0)
                                    return "Today";
                                return `${days} day${days > 1 ? "s" : ""} ago`;
                            },
                            label: function (context) {
                                return context.dataset.label + ": #" + context.parsed.y.toLocaleString('en-US');
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 0,
                        hoverRadius: 10,
                        hitRadius: 10,
                        hoverBorderWidth: 5
                    },
                    line: {
                        borderWidth: 2
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        };

        _chart_data = data;
        _chart = new Chart(ctx, data);
    }

    //when finished resizing window, regenerate the chart (just resize wont work due to how to site works)
    window.addEventListener('resize', () => {
        if (_chart) {
            _chart.destroy();
            _chart = new Chart(document.getElementById("custom_rank_chart"), _chart_data);
        }
    });

    const getOrCreateTooltip = (chart) => {
        let tooltipEl = chart.canvas.parentNode.querySelector('div');

        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.style.background = 'rgba(0, 0, 0, 0.7)';
            tooltipEl.style.borderRadius = '3px';
            tooltipEl.style.color = 'white';
            tooltipEl.style.opacity = 1;
            tooltipEl.style.pointerEvents = 'none';
            tooltipEl.style.position = 'absolute';
            tooltipEl.style.transform = 'translate(-50%, -140%)';
            tooltipEl.style.transition = 'all .1s ease';

            const table = document.createElement('table');
            table.style.margin = '0px';

            tooltipEl.appendChild(table);
            chart.canvas.parentNode.appendChild(tooltipEl);
        }

        return tooltipEl;
    };

    const externalTooltipHandler = (context) => {
        // Tooltip Element
        const { chart, tooltip } = context;
        const tooltipEl = getOrCreateTooltip(chart);

        // Hide if no tooltip
        if (tooltip.opacity === 0) {
            tooltipEl.style.opacity = 0;
            return;
        }

        // Set Text
        if (tooltip.body) {
            const titleLines = tooltip.title || [];
            const bodyLines = tooltip.body.map(b => b.lines);

            const tableHead = document.createElement('thead');

            titleLines.forEach(title => {
                const tr = document.createElement('tr');
                tr.style.borderWidth = 0;

                const th = document.createElement('th');
                th.style.borderWidth = 0;
                const text = document.createTextNode(title);

                th.appendChild(text);
                tr.appendChild(th);
                tableHead.appendChild(tr);
            });

            const tableBody = document.createElement('tbody');
            bodyLines.forEach((body, i) => {
                const colors = tooltip.labelColors[i];

                const span = document.createElement('span');
                span.style.background = colors.backgroundColor;
                span.style.borderColor = colors.borderColor;
                span.style.borderWidth = '2px';
                span.style.marginRight = '10px';
                span.style.height = '10px';
                span.style.width = '10px';
                span.style.display = 'inline-block';

                const tr = document.createElement('tr');
                tr.style.backgroundColor = 'inherit';
                tr.style.borderWidth = 0;

                const td = document.createElement('td');
                td.style.borderWidth = 0;

                const text = document.createTextNode(body);

                td.appendChild(span);
                td.appendChild(text);
                tr.appendChild(td);
                tableBody.appendChild(tr);
            });

            const tableRoot = tooltipEl.querySelector('table');

            // Remove old children
            while (tableRoot.firstChild) {
                tableRoot.firstChild.remove();
            }

            // Add new children
            tableRoot.appendChild(tableHead);
            tableRoot.appendChild(tableBody);
        }

        const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;

        // Display, position, and set styles for font
        tooltipEl.style.opacity = 1;
        tooltipEl.style.left = positionX + tooltip.caretX + 'px';
        tooltipEl.style.top = positionY + tooltip.caretY + 'px';
        tooltipEl.style.font = tooltip.options.bodyFont.string;
        tooltipEl.style.padding = tooltip.options.padding + 'px ' + tooltip.options.padding + 'px';
    };

    function searchElementForAttribute(element, attribute) {
        if (element.getAttribute(attribute)) {
            return element.getAttribute(attribute);
        }

        for (let i = 0; i < element.children.length; i++) {
            const child = element.children[i];
            if (child.getAttribute(attribute)) {
                return child.getAttribute(attribute);
            }
        }

        return null;
    }

    function formatNumberAsSize(number) {
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

    const defaultNumberFormatter = new Intl.NumberFormat(window.currentLocale);
    function formatNumber(num, precision, options, locale) {
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

        return num.toLocaleString(locale ?? window.currentLocale, options);
    }

    async function getBeatmapData(beatmap_id, mode, mods = null) {
        if (!beatmap_id || isNaN(beatmap_id)) {
            return null;
        }

        try {
            // const _beatmap_data = await fetch(`${SCORE_INSPECTOR_API}beatmaps/${beatmap_id}`);
            // beatmap_data = _beatmap_data.json();
            // return beatmap_data;
            //find script with ID "json-beatmapset", this contains a JSON object of the whole beatmapset
            const beatmapset_script = document.getElementById("json-beatmapset");
            if (!beatmapset_script) {
                return null;
            }

            const beatmapset_data = JSON.parse(beatmapset_script.innerHTML);
            let beatmap_data = beatmapset_data?.beatmaps.find(b => b.id === Number(beatmap_id) && b.mode === mode);

            if (!beatmap_data) {
                beatmap_data = beatmapset_data?.converts.find(b => b.id === Number(beatmap_id) && b.mode === mode);
            }

            const attributes = await getBeatmapAttributes(beatmap_id, MODE_SLUGS_ALT.indexOf(mode), mods);

            return {
                beatmapset_data,
                beatmap_data,
                attributes: attributes,
            };
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    async function getBeatmapAttributes(beatmap_id, ruleset_id, mods = null) {
        try {
            const attributes = await fetch(`${SCORE_INSPECTOR_API}extension/difficulty/${beatmap_id}/${ruleset_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    mods
                })
            });

            return (await attributes.json())?.attributes ?? null;
        }
        catch (err) {
            console.error(err);
            return null;
        }
    }

    //url observer
    //triggers events when the url changes

    // let currentUrl = window.location.href;

    if (window.onurlchange === null) {
        window.addEventListener('urlchange', function (e) {
            run();
        });
    }
})();
