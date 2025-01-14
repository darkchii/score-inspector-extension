// ==UserScript==
// @name         osu! scores inspector
// @namespace    https://score.kirino.sh
// @version      2024-12-22.55
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

        const user_exists = data.user != null &&
            (typeof data.coe !== "undefined" || typeof data.coe.error !== "string")
            
        //if the user does not exist, give informational alert.
        if (!user_exists) {
            popup("No osu!alt statistics available for this user.");
            //skip other checks as redundant
            return;
        }

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
