// ==UserScript==
// @name         osu! scores inspector
// @namespace    https://score.kirino.sh
// @version      2024-11-16.54
// @description  Display osu!alt and scores inspector data on osu! website
// @author       Amayakase
// @match        https://osu.ppy.sh/*
// @icon         https://raw.githubusercontent.com/darkchii/score-inspector-extension/main/icon48.png
// @noframes
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @require      https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js
// @require      https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0
// @downloadURL  https://github.com/darkchii/score-inspector-extension/raw/main/inspector.user.js
// @updateURL    https://github.com/darkchii/score-inspector-extension/raw/main/inspector.user.js
// ==/UserScript==

(function () {
    'use strict';

    const SCORE_INSPECTOR_API = "https://api.kirino.sh/inspector/";

    const IMAGE_ICON_SPINNERS = "data:image/png;base64,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";

    const MODE_NAMES = [
        "osu!",
        "osu!taiko",
        "osu!catch",
        "osu!mania"
    ];

    const MODE_SLUGS = [
        "osu",
        "taiko",
        "catch",
        "mania"
    ]

    const MODE_SLUGS_ALT = [
        "osu",
        "taiko",
        "fruits",
        "mania"
    ]

    const GRAPHS = [
        "Performance",
        "Score"
    ]

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
            clan_val: (clan_stats) => {
                return clan_stats.average_pp;
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
            },
            clan_val: (clan_stats) => {
                return clan_stats.total_ss_both;
            }
        },
        s: {
            name: "S",
            val: (user) => {
                return user.s_count + user.sh_count;
            },
            clan_val: (clan_stats) => {
                return clan_stats.total_s_both;
            }
        },
        a: {
            name: "A",
            val: (user) => {
                return user.a_count;
            },
            clan_val: (clan_stats) => {
                return clan_stats.total_a;
            }
        },
        b: {
            name: "B",
            val: (user) => {
                return user.b_count;
            },
            clan_val: (clan_stats) => {
                return clan_stats.total_b;
            }
        },
        c: {
            name: "C",
            val: (user) => {
                return user.c_count;
            },
            clan_val: (clan_stats) => {
                return clan_stats.total_c;
            }
        },
        d: {
            name: "D",
            val: (user) => {
                return user.d_count;
            },
            clan_val: (clan_stats) => {
                return clan_stats.total_d;
            }
        },
        clears: {
            name: "Clears",
            val: (user) => {
                return user.ss_count + user.ssh_count + user.s_count + user.sh_count + user.a_count;
            },
            clan_val: (clan_stats) => {
                return clan_stats.clears;
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
            link: "/rankings/osu/performance"
        }, {
            name: "score",
            attr: "score",
            link: "/rankings/osu/score"
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
            link: "/rankings/osu/country"
        }, {
            name: "multiplayer",
            attr: "multiplayer",
            link: "/multiplayer/rooms/latest"
        }, {
            name: "daily challenge",
            attr: "daily-challenge",
            link: "/rankings/daily-challenge"
        }, {
            name: "seasons",
            attr: "seasons",
            link: "/seasons/latest"
        }, {
            name: "spotlights (old)",
            attr: "spotlights",
            link: "/rankings/osu/charts"
        }, {
            name: "kudosu",
            attr: "kudosu",
            link: "/rankings/kudosu"
        }
    ]

    const CLANS_RANKINGS = [
        {
            name: "performance",
            name_display: "Performance",
            local_path: "performance",
            link: "/clans/performance",
            api_path: "average_pp",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.performance, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.members],
            ]
        },
        {
            name: "total pp",
            name_display: "Total PP",
            local_path: "total_pp",
            link: "/clans/total_pp",
            api_path: "total_pp",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.total_pp, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.members],
            ]
        },
        {
            name: "accuracy",
            name_display: "Accuracy",
            local_path: "accuracy",
            link: "/clans/accuracy",
            api_path: "accuracy",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.accuracy, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.members],
            ]
        }, {
            name: "ranked score",
            name_display: "Ranked Score",
            local_path: "ranked_score",
            link: "/clans/ranked_score",
            api_path: "ranked_score",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.members],
            ]
        }, {
            name: "total score",
            name_display: "Total Score",
            local_path: "total_score",
            link: "/clans/total_score",
            api_path: "total_score",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.members],
            ]
        }, {
            name: 'clears',
            name_display: 'Clears',
            local_path: 'clears',
            link: '/clans/clears',
            api_path: 'clears',
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.clears, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.b],
                [CUSTOM_RANKINGS_ATTRIBUTES.c],
                [CUSTOM_RANKINGS_ATTRIBUTES.d],
                [CUSTOM_RANKINGS_ATTRIBUTES.members],
            ]
        }, {
            name: 'total ss',
            name_display: 'SS',
            local_path: 'ss',
            link: '/clans/ss',
            api_path: 'total_ss_both',
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.ss, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.b],
                [CUSTOM_RANKINGS_ATTRIBUTES.c],
                [CUSTOM_RANKINGS_ATTRIBUTES.d],
                [CUSTOM_RANKINGS_ATTRIBUTES.members],
            ]
        }, {
            name: 'total s',
            name_display: 'S',
            local_path: 's',
            link: '/clans/s',
            api_path: 'total_s_both',
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.b],
                [CUSTOM_RANKINGS_ATTRIBUTES.c],
                [CUSTOM_RANKINGS_ATTRIBUTES.d],
                [CUSTOM_RANKINGS_ATTRIBUTES.members],
            ]
        }, {
            name: 'total a',
            name_display: 'A',
            local_path: 'a',
            link: '/clans/a',
            api_path: 'total_a',
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.b],
                [CUSTOM_RANKINGS_ATTRIBUTES.c],
                [CUSTOM_RANKINGS_ATTRIBUTES.d],
                [CUSTOM_RANKINGS_ATTRIBUTES.members],
            ]
        }, {
            name: 'total b',
            name_display: 'B',
            local_path: 'b',
            link: '/clans/b',
            api_path: 'total_b',
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.b, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.c],
                [CUSTOM_RANKINGS_ATTRIBUTES.d],
                [CUSTOM_RANKINGS_ATTRIBUTES.members],
            ]
        }, {
            name: 'total c',
            name_display: 'C',
            local_path: 'c',
            link: '/clans/c',
            api_path: 'total_c',
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.b],
                [CUSTOM_RANKINGS_ATTRIBUTES.c, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.d],
                [CUSTOM_RANKINGS_ATTRIBUTES.members],
            ]
        }, {
            name: 'total d',
            name_display: 'D',
            local_path: 'd',
            link: '/clans/d',
            api_path: 'total_d',
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.b],
                [CUSTOM_RANKINGS_ATTRIBUTES.c],
                [CUSTOM_RANKINGS_ATTRIBUTES.d, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.members],
            ]
        }, {
            name: 'playtime',
            name_display: 'Playtime',
            local_path: 'playtime',
            link: '/clans/playtime',
            api_path: 'playtime',
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.playtime, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.playcount],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.members],
            ]
        }, {
            name: 'playcount',
            name_display: 'Playcount',
            local_path: 'playcount',
            link: '/clans/playcount',
            api_path: 'playcount',
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.playtime],
                [CUSTOM_RANKINGS_ATTRIBUTES.playcount, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.members],
            ]
        }, {
            name: 'replays watched',
            name_display: 'Replays Watched',
            local_path: 'replays_watched',
            link: '/clans/replays_watched',
            api_path: 'replays_watched',
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.replays_watched, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.playcount],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.members],
            ]
        }, {
            name: 'total hits',
            name_display: 'Total Hits',
            local_path: 'total_hits',
            link: '/clans/total_hits',
            api_path: 'total_hits',
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.total_hits, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.playcount],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.members],
            ]
        }, {
            name: 'badges',
            name_display: 'Badges',
            local_path: 'badges',
            link: '/clans/badges',
            api_path: 'badges',
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.badges, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.medals],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.members],
            ]
        }, {
            name: 'medals',
            name_display: 'Medals',
            local_path: 'medals',
            link: '/clans/medals',
            api_path: 'medals',
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.badges],
                [CUSTOM_RANKINGS_ATTRIBUTES.medals, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.members],
            ]
        }, {
            name: 'members',
            name_display: 'Members',
            local_path: 'members',
            link: '/clans/members',
            api_path: 'members',
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.members, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
            ]
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

    async function run() {
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

        await runClansPage();
        await runHeader();
        await runUserPage();
        await runUsernames();
        await runScoreRankCompletionPercentages();
        await runScoreRankChanges();
        await runBeatmapPage();
    }

    function start() {
        run();
        document.addEventListener("turbo:load", run)
    }
    start();

    async function runHeader() {
        //if element with id "osu-scores-inspector-clans" exists, return
        if (document.getElementById("osu-scores-inspector-clans")) {
            return;
        }
        //find header (class "nav2__colgroup nav2__colgroup--menu js-nav-button--container")
        const header = document.getElementsByClassName("nav2__colgroup nav2__colgroup--menu js-nav-button--container")[0];

        if (header) {
            //create element "div" with class "nav2__col nav2__col--menu" and text "osu! scores inspector"
            const header_element = document.createElement("div");
            header_element.classList.add("nav2__col", "nav2__col--menu");
            //give it an identifier
            header_element.id = "osu-scores-inspector-clans";

            //create element "a" with class "nav2__menu-link-main" and text "clans"
            const header_element_link = document.createElement("a");
            header_element_link.classList.add("nav2__menu-link-main", "js-menu");
            header_element_link.href = "/clans/performance";
            header_element.appendChild(header_element_link);

            //add span with class "u-relative"
            const header_element_span = document.createElement("span");
            header_element_span.classList.add("u-relative");
            header_element_span.textContent = "clans";
            //if we are on '/clans', add span with "nav2__menu-link-bar u-section--bg-normal"
            if (window.location.href.includes("/clans")) {
                const header_element_span_underline = document.createElement("span");
                header_element_span_underline.classList.add("nav2__menu-link-bar", "u-section--bg-normal");
                header_element_span.appendChild(header_element_span_underline);
            }
            header_element_link.appendChild(header_element_span);

            //append header_element to header (2nd to last child)
            header.insertBefore(header_element, header.children[header.children.length - 1]);
        }
    }

    const CLANS_PER_PAGE = 50;
    async function runClansPage() {
        let url = window.location.href.split("?")[0];
        url = url.replace("https://osu.ppy.sh", "");

        //if we are on '/clans'
        if (url.includes("/clans/")) {
            //get current clan ranking
            const active_clan_ranking = CLANS_RANKINGS.find(ranking => ranking.local_path === url.split("/")[2]);
            if (!active_clan_ranking || !url.includes(active_clan_ranking.local_path)) {
                return;
            }

            const page_data = await runCleanErrorPage(active_clan_ranking.name, "clans", {
                title: "clans"
            });

            const container = page_data.container;
            const header_nav = page_data.header_nav;

            const clans_container = document.createElement("div");
            clans_container.classList.add("osu-page", "osu-page--generic");
            clans_container.id = "scores";
            container.appendChild(clans_container);

            let page = new URLSearchParams(window.location.search).get("page") ?? 1;
            page = Number(page) || 1;

            //first try to get data now
            const fetch_url = `${SCORE_INSPECTOR_API}clans/list?page=${page}&sort=${active_clan_ranking.api_path}&limit=50`;
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
                clans_container.innerHTML = "An error occurred while fetching the data. Please try again later.";
                return;
            }

            //add a button to go to the clans website
            const button_parent = document.createElement("div");
            //align content to the right
            button_parent.style.textAlign = "right";


            const clans_website_button = document.createElement("a");
            clans_website_button.classList.add("btn-osu-big");
            clans_website_button.href = "https://score.kirino.sh/clan";
            clans_website_button.target = "_blank";

            const button_content = document.createElement("div");
            button_content.classList.add("btn-osu-big__content");
            clans_website_button.appendChild(button_content);

            const button_text = document.createElement("div");
            button_text.classList.add("btn-osu-big__left");
            button_text.textContent = "More on scores inspector";
            button_content.appendChild(button_text);

            const button_icon = document.createElement("div");
            button_icon.classList.add("btn-osu-big__right");
            button_icon.innerHTML = `<i class="fas fa-external-link-alt"></i>`;
            button_content.appendChild(button_icon);
            //align button to the right
            button_parent.appendChild(clans_website_button);

            clans_container.appendChild(button_parent);

            createRankingNavigation({
                nav: header_nav,
                items: CLANS_RANKINGS.map(ranking => {
                    return {
                        name: ranking.name,
                        attr: ranking.local_path,
                        link: ranking.link
                    }
                }),
                active: active_clan_ranking.local_path
            });

            const clan_pages = Math.ceil(data.query_clans / CLANS_PER_PAGE);

            clans_container.appendChild(createPagination(page, active_clan_ranking.link, clan_pages));

            const ranking_page = document.createElement("div");
            ranking_page.classList.add("ranking-page");
            clans_container.appendChild(ranking_page);

            const ranking_table = document.createElement("table");
            ranking_table.classList.add("ranking-page-table");
            ranking_page.appendChild(ranking_table);

            const ranking_thead = document.createElement("thead");
            ranking_table.appendChild(ranking_thead);

            ranking_thead.appendChild(createTableHeaderItem());
            ranking_thead.appendChild(createTableHeaderItem());
            ranking_thead.appendChild(createTableHeaderItem());
            // ranking_thead.appendChild(createTableHeaderItem(active_clan_ranking.name_display, true));
            active_clan_ranking.attributes.forEach(attribute => {
                ranking_thead.appendChild(createTableHeaderItem(attribute[0].name, true));
            });

            const ranking_tbody = document.createElement("tbody");
            ranking_table.appendChild(ranking_tbody);

            const _addTableBodyRow = (clan, index) => {
                const tr = document.createElement("tr");
                tr.classList.add("ranking-page-table__row");

                const td_rank = document.createElement("td");
                td_rank.classList.add("ranking-page-table__column", "ranking-page-table__column--rank");
                td_rank.textContent = `#${(page - 1) * CLANS_PER_PAGE + index + 1}`;
                tr.appendChild(td_rank);

                const td_clan_tag = document.createElement("td");
                td_clan_tag.classList.add("ranking-page-table__column", "ranking-page-table__user");
                const td_clan_tag_link = document.createElement("a");
                td_clan_tag_link.href = `https://score.kirino.sh/clan/${clan.id}`;
                td_clan_tag_link.target = "_blank";
                td_clan_tag_link.textContent = `[${clan.tag}]`;
                td_clan_tag_link.style.color = `#${clan.color}`;
                //bold clan tag
                td_clan_tag_link.style.fontWeight = "bold";
                td_clan_tag.appendChild(td_clan_tag_link);
                //align clan tag to the right
                td_clan_tag.style.textAlign = "right";
                //padding right
                td_clan_tag.style.paddingRight = "10px";
                tr.appendChild(td_clan_tag);

                const td_clan = document.createElement("td");
                td_clan.classList.add("ranking-page-table__column", "ranking-page-table__user");
                const td_clan_link = document.createElement("a");
                td_clan_link.href = `https://score.kirino.sh/clan/${clan.id}`;
                td_clan_link.target = "_blank";
                td_clan_link.textContent = clan.name;
                td_clan.appendChild(td_clan_link);
                //align clan name to the left
                td_clan.style.textAlign = "left";
                tr.appendChild(td_clan);

                for (const attribute of active_clan_ranking.attributes) {
                    const formatter = attribute[0].formatter ?? ((val) => val.toLocaleString());
                    const td = document.createElement("td");
                    td.classList.add("ranking-page-table__column");
                    if (!attribute[1]) {
                        td.classList.add("ranking-page-table__column--dimmed");
                    }
                    td.textContent = formatter(attribute[0].clan_val ? attribute[0].clan_val(clan.clan_stats) : attribute[0].val(clan.clan_stats));
                    if (attribute[0].tooltip_formatter) {
                        td.setAttribute("data-html-title", attribute[0].tooltip_formatter(attribute[0].clan_val ? attribute[0].clan_val(clan.clan_stats) : attribute[0].val(clan.clan_stats)));
                        td.setAttribute("title", "");
                    }
                    tr.appendChild(td);
                }

                ranking_tbody.appendChild(tr);
            }

            data.clans.forEach((clan, index) => {
                _addTableBodyRow(clan, index);
            });

            clans_container.appendChild(createPagination(page, active_clan_ranking.link, clan_pages));
        }
    }

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

    async function runBeatmapPage() {
        if (!window.location.href.includes("/beatmapsets/")) {
            return;
        }

        //cache original background urls
        const orig_bg_cache = {};
        const runner = async () => {
            if (!window.location.href.includes("/beatmapsets/")) {
                return;
            }

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

            const new_background_url = `https://bg.kirino.sh/get/${active_beatmap_id}`;
            const cover = document.getElementsByClassName('beatmapset-cover beatmapset-cover--full')[0];
            const current_background_url = cover.style.getPropertyValue('--bg').replace('url(', '').replace(')', '');
            if (!orig_bg_cache[beatmapset_id]) {
                orig_bg_cache[beatmapset_id] = current_background_url;
            }
            cover.style.setProperty('--bg', `url(${new_background_url}), url(${orig_bg_cache[beatmapset_id]})`);

            //get beatmap data
            const beatmap = await getBeatmapData(active_beatmap_id);

            if (beatmap && !Array.isArray(beatmap)) {
                console.log(beatmap);
                //get beatmap-basic-stats div
                const beatmap_basic_stats = document.getElementsByClassName("beatmap-basic-stats")[0];
                
                if (beatmap_basic_stats.querySelector(`#beatmap-basic-stats__entry--spinner-count`)) {
                    beatmap_basic_stats.querySelector(`#beatmap-basic-stats__entry--spinner-count`).remove();
                }

                const last_entry = beatmap_basic_stats.children[beatmap_basic_stats.children.length - 1];
                const new_entry = last_entry.cloneNode(true);
                //change "data-orig-title"
                new_entry.setAttribute("title", "Spinner Count");

                //remove data-has-qtip and aria-describedby
                new_entry.removeAttribute("data-has-qtip");
                new_entry.removeAttribute("aria-describedby");
                new_entry.removeAttribute("data-orig-title");
                //give it an unique id
                new_entry.id = "beatmap-basic-stats__entry--spinner-count";
                //change child span
                new_entry.children[1].textContent = beatmap.spinners;

                new_entry.children[0].style.backgroundImage = `url(${IMAGE_ICON_SPINNERS})`;

                if (!beatmap_basic_stats.querySelector(`#beatmap-basic-stats__entry--spinner-count`)) {
                    beatmap_basic_stats.appendChild(new_entry);
                }
            }
        }

        window.addEventListener('inspector_url_changed', (event) => {
            runner();
        })
        runner();
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
                a.href = item.link;
                a.textContent = item.name;
                a.setAttribute("data-content", item.attr);
                li.appendChild(a);

                if (item.attr === data.active) {
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

        const active_custom_ranking = CUSTOM_RANKINGS.find(ranking => ranking.path === url);
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

                const countryFlagUrl = document.createElement("a");
                countryFlagUrl.href = `/rankings/osu/performance?country=${data.country_code}`;
                countryFlagUrl.style.display = "inline-block";

                const countryFlag = document.createElement("span");
                countryFlag.classList.add("flag-country", "flag-country--medium");
                countryFlag.style.backgroundImage = `url(https://flagpedia.net/data/flags/h24/${data.country_code.toLowerCase()}.webp)`;
                countryFlag.setAttribute("title", data.country_name);
                countryFlagUrl.appendChild(countryFlag);
                userLinkParent.appendChild(countryFlagUrl);

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
                        td.setAttribute("data-html-title", attr[0].tooltip_formatter(attr[0].val(data)));
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

        //empty the header nav
        createRankingNavigation({
            nav: headerNav,
            items: lb_page_nav_items,
            active: active_custom_ranking ? active_custom_ranking.api_path : null
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

    //finds all usernames on the page and adds clan tags to them
    async function runUsernames() {
        let isWorking = false;
        const _func = async () => {
            if (isWorking) {
                return;
            }
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
                const user_ids = Array.from(usercards).map(card => card.getAttribute("data-user-id"));
                const user_ids_big = Array.from(usercards_big).map(card => getUserCardBigID(card));

                const _user_ids = user_ids.concat(user_ids_big).filter((v, i, a) => a.indexOf(v) === i);
                //unique user ids
                const clan_data = await getUsersClans(_user_ids);

                if (clan_data && Array.isArray(clan_data) && clan_data.length > 0) {
                    modifyJsUserCards(clan_data);
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
                    // On the user profile, update clan tags when "Load More" is called.
                    if (window.location.href.includes("/users/") || window.location.href.includes("/u/")) {
                        if (mutation.target.classList.contains("osu-layout__col-container")) {
                            _func();
                        }
                    }

                    if (window.location.href.includes("/beatmapsets/")) {
                        if (
                            mutation.target.classList.contains("beatmapset-scoreboard__main") ||
                            mutation.target.classList.contains("beatmap-scoreboard-table") ||
                            mutation.target.classList.contains("beatmap-scoreboard-table__body") ||
                            mutation.target.classList.contains("osuplus-table")) {
                            _func();
                        }
                    }

                    if (window.location.href.includes("/community/chat")) {
                        if (mutation.target.classList.contains("chat-conversation")) {
                            _func();
                        }
                    }

                    //if qtip--user-card is added or enabled, run the function
                    if (mutation.target.classList.contains("qtip--user-card")) {
                        _func();
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    function getUserCardBigID(card) {
        const a = card.querySelector("a");
        const href_split = a.href.split("/");
        const user_id = href_split[href_split.length - 1];
        return user_id;
    }

    function modifyJsUserCards(clan_data) {
        // let usercards = document.querySelectorAll("[class*='js-usercard']");
        //get all usercards that have class "js-usercard" or "user-card"
        let usercards = document.querySelectorAll("[class*='js-usercard'], [class*='user-card']");
        //filter out with class "comment__avatar"
        usercards = Array.from(usercards).filter(card => !card.classList.contains("comment__avatar"));
        //filter out with child class "avatar avatar--guest avatar--beatmapset"
        usercards = usercards.filter(card => !card.querySelector(".avatar.avatar--guest.avatar--beatmapset"));
        //filter out with parent class "chat-conversation__new-chat-avatar"
        usercards = usercards.filter(card => !card.parentElement.classList.contains("chat-conversation__new-chat-avatar"));

        if (window.location.href.includes("/rankings/")) {
            //check if "ranking-page-table__user-link" have a div as first child
            const userLinks = document.getElementsByClassName("ranking-page-table__user-link");
            const userLinksArray = Array.from(userLinks);

            let uses_region_flags = false;
            //if the first child is a div, and any has more than 1 child inside the div, then it uses region flags
            uses_region_flags = userLinksArray.some(link => link.children[0].tagName === "DIV" && link.children[0].children.length > 1);

            //if we use region flags, we append a fake one for divs that only have 1 child, to fill the gap
            //basically duplicate the first child, as a test
            if (uses_region_flags) {
                usercards = usercards.map((card, i) => {
                    const userLink = userLinksArray[i];
                    if (userLink) {
                        //if first element is A with "country" somewhere in the url, create a div at index 0, and move the A into it
                        if (userLink.children[0].tagName === "A" && userLink.children[0].href.includes("country")) {
                            //create a div at index 0
                            const div = document.createElement("div");
                            //move div into it
                            div.appendChild(userLink.children[0]);
                            //move div to index 1
                            userLink.insertBefore(div, userLink.children[0]);

                        }

                        if (userLink.children[0].tagName === "DIV" && userLink.children[0].children.length === 1) {
                            const cloned = userLink.children[0].children[0].cloneNode(true);
                            userLink.children[0].appendChild(cloned);

                            //add display: inline-block to both children
                            userLink.children[0].children[0].style.display = "inline-block";
                            userLink.children[0].children[1].style.display = "inline-block";
                            //margin-left 4px to the second child
                            userLink.children[0].children[1].style.marginLeft = "4px";
                            //opacity 0 to second child
                            userLink.children[0].children[1].style.opacity = "0";
                        }
                    }
                    return card;
                });
            }
        }

        for (let i = 0; i < usercards.length; i++) {
            if (!clan_data || clan_data.length === 0) return;

            let user_id = null;
            let user_clan_data = null;
            //if user-card
            if (usercards[i].classList.contains("user-card")) {
                user_id = getUserCardBigID(usercards[i]);
                user_clan_data = clan_data.find(clan => clan.osu_id == user_id);

                if (!user_clan_data || !user_id) {
                    continue;
                }

                setBigUserCardClanTag(usercards[i], user_clan_data);

                continue;
            }

            user_id = usercards[i].getAttribute("data-user-id");
            user_clan_data = clan_data.find(clan => clan.osu_id == user_id);

            if (!user_clan_data || !user_id) {
                continue;
            }

            setUserCardBrickClanTag(usercards[i], user_clan_data);
        }
    }

    const generateTagSpan = (clan) => {
        const clanTag = document.createElement("a");
        clanTag.textContent = `[${clan.clan.tag}] `;
        clanTag.style.color = `#${clan.clan.color}`;
        clanTag.style.fontWeight = "bold";
        clanTag.href = `https://score.kirino.sh/clan/${clan.clan.id}`;
        clanTag.target = "_blank";
        //force single line
        clanTag.style.whiteSpace = "nowrap";
        //set id
        clanTag.classList.add("inspector_user_tag");

        return clanTag;
    }

    function setBigUserCardClanTag(card, clan) {
        const usernameElement = card.getElementsByClassName("user-card__username u-ellipsis-pre-overflow")[0];

        if (usernameElement.getElementsByClassName("inspector_user_tag").length > 0) {
            return;
        }

        const clanTag = generateTagSpan(clan);
        usernameElement.insertBefore(clanTag, usernameElement.childNodes[0]);
    }

    function setUserCardBrickClanTag(card, clan) {
        //get content of the element (the username)
        let username = card.textContent;
        //trim the username
        username = username.trim();

        //create a span element ([clan_tag] username), set the color and url to the clan tag
        const clanTag = generateTagSpan(clan);

        //if usercard has class "beatmap-scoreboard-table__cell-content" along with it, add whitespace-width padding
        if (card.classList.contains("beatmap-scoreboard-table__cell-content")) {
            clanTag.style.paddingRight = "5px";
        }

        //if usercard has a "user-card-brick__link" child, insert the clan tag in there at index 1
        const usercardLink = card.getElementsByClassName("user-card-brick__link")[0];
        if (usercardLink) {
            //first check if one exists already
            if (usercardLink.getElementsByClassName("inspector_user_tag").length > 0) {
                return;
            }
            clanTag.style.marginRight = "5px";
            usercardLink.insertBefore(clanTag, usercardLink.childNodes[1]);
            //if usercard has parent with class "chat-message-group__sender"
        } else if (card.parentElement.classList.contains("chat-message-group__sender")) {
            //check if one exists already
            if (card.parentElement.getElementsByClassName("inspector_user_tag").length > 0) {
                return;
            }

            const parent = card.parentElement;
            //find child in parent with class "chat-message-group__username"
            const usernameElement = parent.getElementsByClassName("chat-message-group__username")[0];
            //insert clan tag in usernameElement before the text
            usernameElement.insertBefore(clanTag, usernameElement.childNodes[0]);
        } else {
            //check if one exists already
            if (card.getElementsByClassName("inspector_user_tag").length > 0) {
                return;
            }
            card.insertBefore(clanTag, card.childNodes[0]);
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
                    td.textContent = formatNumber(change);
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

        if (data.coe && !data.coe.error) {
            setOrCreateCoeBannerElement(data.coe);
        }

        if (data.clan && !data.clan?.pending) {
            setOrCreateUserClanTagElement(data.clan.clan);
            setOrCreateUserClanBannerElement(data.clan);
        }

        if (data.completion) {
            setCompletionistBadges(data.completion);
        }

        //if theres more than just .coe
        if (data && Object.keys(data).length > 1) {
            setOrCreateStatisticsElements(data);
            setNewRankGraph(data.scoreRankHistory, data.scoreRank);
        }
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

    let _userClansCache = [];
    let _dontFetchFuture = []; //these ids did NOT returns from the fetch, so we don't fetch them again until the page is reloaded
    async function getUsersClans(user_ids) {
        let _user_ids = [...user_ids];
        let cached_users = [];
        if (_userClansCache.length > 0) {
            for (let i = 0; i < _user_ids.length; i++) {
                const user = _userClansCache.find(c => c.osu_id == _user_ids[i]);
                if (user) {
                    cached_users.push(user);
                }
            }
        }

        // filter out the cached users from the user_ids
        if (cached_users.length > 0) {
            _user_ids = _user_ids.filter(id => !cached_users.find(c => c.osu_id.toString() == id));
        }

        //filter out the _dontFetchFuture from the user_ids
        if (_dontFetchFuture.length > 0) {
            _user_ids = _user_ids.filter(id => !_dontFetchFuture.includes(id));
        }

        let uncached_users = [];

        if (_user_ids.length > 0) {
            const url = SCORE_INSPECTOR_API + "extension/clans/users";
            const response = await fetch(url, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json"
                },
                method: "POST",
                body: JSON.stringify({
                    ids: _user_ids
                })
            });

            const data = await response.json();

            if (!data || data.error) {
                console.error(data?.error);
                uncached_users = [];
            } else {
                uncached_users = JSON.parse(JSON.stringify(data));
                //all IDs that are in _user_ids but not in uncached_users, we don't fetch them again
                _dontFetchFuture = _user_ids.filter(id => !uncached_users.find(c => c.osu_id.toString() == id));
            }
        }

        //add the uncached users to the cache if they are not already in it (async might have race conditions, we don't worry about it)

        const merged_data = [...cached_users, ...uncached_users];

        //push to cache if not already in it
        if (uncached_users?.length > 0) {
            uncached_users.forEach(u => {
                if (!_userClansCache.find(c => c.osu_id == u.osu_id)) {
                    _userClansCache.push(u);
                }
            });
        }

        return merged_data;
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

    function setOrCreateUserClanTagElement(clan) {
        //check if element with id "inspector_user_tag" exists
        var userTagElement = document.getElementById("inspector_user_tag");
        var userTagParent = null;

        //if it doesn't, create it (clone it from the first child of the profile-info__name node)
        if (!userTagElement) {
            var profileNameParentNode = document.getElementsByClassName("profile-info__name")[0];
            userTagElement = profileNameParentNode.childNodes[0].cloneNode(true);
            userTagElement.id = "inspector_user_tag";

            //create a div
            var div = document.createElement("a");
            div.style.display = "inline";
            //no underline
            div.style.textDecoration = "none";

            //add cloned element to the div
            div.appendChild(userTagElement);
            userTagParent = div;

            //add the div to the parent node
            profileNameParentNode.insertBefore(div, profileNameParentNode.childNodes[0]);
        } else {
            //get the parent of the userTagElement
            userTagParent = userTagElement.parentNode;
        }

        //set the text content of the element to the inspector_user tag
        userTagElement.textContent = `[${clan.tag}]`;
        userTagElement.style.color = `#${clan.color}`;
        userTagElement.style.marginRight = "5px";
        userTagElement.style.fontWeight = "bold";

        //give it a tooltip
        userTagParent.setAttribute("data-title", `<div>${clan.name}</div>`);
        userTagParent.setAttribute("title", "");

        //make it a link to the clan page
        userTagParent.href = `https://score.kirino.sh/clan/${clan.id}`;
        userTagParent.target = "_blank";
    }

    function setOrCreateUserClanBannerElement(user_clan) {
        //find data-page-id "main"
        const mainElement = document.querySelector("[data-page-id='main']");

        //find index of class "profile-cover profile-info--cover"
        const coverIndex = Array.from(mainElement.children).findIndex(child => child.classList.contains("profile-cover"));

        var clanBanner = document.getElementById("inspector_user_banner");
        if (clanBanner) {
            //remove it and re-add it
            clanBanner.remove();
        }
        clanBanner = getBaseBannerElement("inspector_user_banner", user_clan.clan.header_image_url);

        var rawHtml = `
            <div style="display: flex; align-items: center; height: 100%;">
                <div style="display: flex; flex-direction: row; justify-content: center;">
                    <div style="display: flex; flex-direction: column; justify-content: center; margin-right: 1rem;">
                        <p style="margin-bottom: 0px; font-size: 22px; color: white;">
                            <i class="fas fa-users"></i>
                        </p>
                    </div>
                    <div style="display: flex; flex-direction: column; justify-content: center;">
                        <p style="margin-bottom: 0px; font-size: 22px;">Member of <a href="https://score.kirino.sh/clan/${user_clan.clan.id}" target="_blank"><span id="inspector_user_clan_tag" style='color:#${user_clan.clan.color}'></span> <span id="inspector_user_clan_name"></span></a></p>
                        <p style="margin-bottom: 0px; font-size: 12px;">Since ${new Date(user_clan.join_date).toLocaleDateString("en-GB", {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })}</p>
                    </div>
                </div>
            </div>
        `;
        var overlay = clanBanner.querySelector("#inspector_user_banner_overlay");
        overlay.innerHTML = rawHtml;

        var clanTagElement = overlay.querySelector("#inspector_user_clan_tag");
        clanTagElement.innerText = `[${user_clan.clan.tag}]`;

        var clanNameElement = overlay.querySelector("#inspector_user_clan_name");
        clanNameElement.innerText = user_clan.clan.name;

        //insert it after the cover
        mainElement.insertBefore(clanBanner, mainElement.children[coverIndex + 2]);
    }

    function setOrCreateCoeBannerElement(coe) {
        //find data-page-id "main"
        const mainElement = document.querySelector("[data-page-id='main']");

        //find index of class "profile-cover profile-info--cover"
        const coverIndex = Array.from(mainElement.children).findIndex(child => child.classList.contains("profile-cover"));

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
    function setNewRankGraph(score_rank_history, current_rank) {
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

            chartParent.insertBefore(chartOwner, chartParent.children[0]);
            //insert the toggle after the chart
            chartParent.insertBefore(toggleLink, chartParent.children[1]);

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

    function formatNumber(number) {
        //convert to K, M, B, etc
        if (number < 1000) {
            return number;
        }
        const SI_SYMBOL = ["", "k", "M", "B", "T"];
        const tier = Math.log10(number) / 3 | 0;
        if (tier == 0) return number;
        const suffix = SI_SYMBOL[tier];
        const scale = Math.pow(10, tier * 3);
        const scaled = number / scale;
        return scaled.toFixed(1) + suffix;
    }

    async function getBeatmapData(beatmap_id) {
        let beatmap_data = null;
        try {
            const _beatmap_data = await fetch(`${SCORE_INSPECTOR_API}beatmaps/${beatmap_id}`);
            beatmap_data = _beatmap_data.json();
            return beatmap_data;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    //url observer
    //triggers events when the url changes

    let currentUrl = window.location.href;

    setInterval(() => {
        if (currentUrl !== window.location.href) {
            currentUrl = window.location.href;
            window.dispatchEvent(new Event('inspector_url_changed'));
        }
    }, 1000);
})();
