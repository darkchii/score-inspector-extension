// ==UserScript==
// @name         osu! scores inspector
// @namespace    https://score.kirino.sh
// @version      2024-08-06.40
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
        },
        s: {
            name: "S",
            val: (user) => {
                return user.s_count + user.sh_count;
            },
        },
        a: {
            name: "A",
            val: (user) => {
                return user.a_count;
            },
        },
        b: {
            name: "B",
            val: (user) => {
                return user.b_count;
            },
        },
        c: {
            name: "C",
            val: (user) => {
                return user.c_count;
            },
        },
        d: {
            name: "D",
            val: (user) => {
                return user.d_count;
            },
        },
        clears: {
            name: "Clears",
            val: (user) => {
                return user.ss_count + user.ssh_count + user.s_count + user.sh_count + user.a_count;
            },
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
            name: "seasons",
            attr: "seasons",
            link: "/seasons/latest"
        }, {
            name: "spotlights (old)",
            attr: "spotlights",
            link: "/ranking/osu/charts"
        }, {
            name: "kudosu",
            attr: "kudosu",
            link: "/rankings/kudosu"
        }
    ]

    const MAX_RANK_PAGE = 200;

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
            //header-nav-v4--list needs to flex start fill
            //if game-mode is active, set width to 80%, else 100%
            GM_addStyle(`
                .header-nav-v4--list {
                    flex-grow: 1;
                    width: 88%;
                }

                .header-nav-v4__item {
                    padding-top: 2px;
                    padding-bottom: 2px;
                }
                    
                .game-mode {
                    position: relative;
                    right: 0;
                    left: 50;
                    width: 12%;
                    flex-grow: 1;
                }
            `);
            await handleLeaderboardPage();
        }

        await runUserPage();
        await runUsernames();
        await runScoreRankCompletionPercentages();
        await runScoreRankChanges();


    }

    function start(){
        run();
        document.addEventListener("turbolinks:load", run)
    }
    start();

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
            //wait 0.5s for the page to load

            //set page title to "total ss (bullet) rankings | osu!"
            document.title = `${active_custom_ranking.name} • rankings | osu!`;

            const container = document.getElementsByClassName("osu-layout__section osu-layout__section--full")[0];
            container.innerHTML = "";

            const rankings_container = document.createElement("div");
            rankings_container.classList.add("header-v4", "header-v4--rankings");
            container.appendChild(rankings_container);

            const rankings_header = document.createElement("div");
            rankings_header.classList.add("header-v4__container", "header-v4__container--main");
            rankings_container.appendChild(rankings_header);

            const rankings_header_bg_container = document.createElement("div");
            rankings_header_bg_container.classList.add("header-v4__bg-container");
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
            rankings_header_content_title_text.textContent = "rankings";
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

            headerNav = ranking_headers_row_nav;

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

            const createPagination = (page) => {
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
                    nav_prev_span.href = `/rankings/osu/${active_custom_ranking.api_path}?page=${page - 1}`;
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
                    a.href = `/rankings/osu/${active_custom_ranking.api_path}?page=${_page}`;
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
                for (let i = 1; i <= MAX_RANK_PAGE; i++) {
                    if (i === 1 || i === MAX_RANK_PAGE || (i >= page - BUTTONS_BEFORE_CURRENT_PAGE && i <= page + BUTTONS_AFTER_CURRENT_PAGE)) {
                        pagination_items.appendChild(_createPageButton(i, i === page));
                    } else if (i === page - BUTTONS_BEFORE_CURRENT_PAGE - 1 || i === page + BUTTONS_AFTER_CURRENT_PAGE + 1) {
                        const li = document.createElement("li");
                        li.classList.add("pagination-v2__item");
                        li.textContent = "...";
                        pagination_items.appendChild(li);
                    }
                }

                let nav_next_span = null;
                if (page === MAX_RANK_PAGE) {
                    nav_next_span = document.createElement("span");
                    nav_next_span.classList.add("pagination-v2__link", "pagination-v2__link--quick", "pagination-v2__link--disabled");
                } else {
                    nav_next_span = document.createElement("a");
                    nav_next_span.classList.add("pagination-v2__link", "pagination-v2__link--quick");
                    // nav_next_span.href = `/rankings/osu/ss?page=${page + 1}`;
                    nav_next_span.href = `/rankings/osu/${active_custom_ranking.api_path}?page=${page + 1}`;;
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

            scores_container.appendChild(createPagination(page));

            //leaderboard, tbd
            const ranking_page = document.createElement("div");
            ranking_page.classList.add("ranking-page");
            scores_container.appendChild(ranking_page);

            const ranking_table = document.createElement("table");
            ranking_table.classList.add("ranking-page-table");
            ranking_page.appendChild(ranking_table);

            const ranking_thead = document.createElement("thead");
            ranking_table.appendChild(ranking_thead);

            const _addTableHeaderItem = (text = '', is_focus = false, is_grade = false) => {
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

            ranking_thead.appendChild(_addTableHeaderItem());
            ranking_thead.appendChild(_addTableHeaderItem());
            // ranking_thead.appendChild(_addTableHeaderItem('Total Score'));
            // ranking_thead.appendChild(_addTableHeaderItem('Ranked Score'));
            // ranking_thead.appendChild(_addTableHeaderItem('SS', true, true));
            // ranking_thead.appendChild(_addTableHeaderItem('S', false, true));
            // ranking_thead.appendChild(_addTableHeaderItem('A', false, true));
            // ranking_thead.appendChild(_addTableHeaderItem('Clears', false));

            for (let attr of active_custom_ranking.attributes) {
                ranking_thead.appendChild(_addTableHeaderItem(attr[0].name, attr[1] ?? false));
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
            scores_container.appendChild(createPagination(page));
        }

        //empty the header nav
        headerNav.innerHTML = "";
        lb_page_nav_items.forEach(item => {
            if (!headerNav.querySelector(`[data-content="${item.attr}"]`)) {
                const li = document.createElement("li");
                li.classList.add("header-nav-v4__item");

                const a = document.createElement("a");
                a.classList.add("header-nav-v4__link");
                a.href = item.link;
                a.textContent = item.name;
                a.setAttribute("data-content", item.attr);

                if (url === item.link) {
                    a.classList.add("header-nav-v4__link--active");
                }

                li.appendChild(a);

                headerNav.appendChild(li);
            }
        });
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

        const getRankChangeText = (change) => {
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
                td.textContent = Math.abs(change);
            }

            return td;
        }

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.getElementsByTagName('td');
            const user_id = cells[USER_INDEX].getElementsByClassName('js-usercard')[0].getAttribute('data-user-id');
            const current_rank_str = cells[RANK_INDEX].textContent; //"#1", "#2", etc
            const current_rank = parseInt(current_rank_str.trim().slice(1)); //remove the "#" and parse to int

            const rank_change_data = data.find(d => d.osu_id == user_id);
            let change = 0;

            if (rank_change_data) {
                let old_rank = parseInt(rank_change_data.rank);
                change = old_rank - current_rank;
            }

            const rank_change_text = getRankChangeText(change);
            row.insertBefore(rank_change_text, cells[RANK_CHANGE_INDEX]);

            const rank_change_icon = getRankChangeIcon(change);
            row.insertBefore(rank_change_icon, cells[RANK_CHANGE_INDEX]);
        }

        //insert empty header cells for rank change at RANK_CHANGE_INDEX
        headerRow.insertBefore(document.createElement('th'), headerCells[RANK_CHANGE_INDEX]);
        headerRow.insertBefore(document.createElement('th'), headerCells[RANK_CHANGE_INDEX]);
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

            console.log(user_data);
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
        let profile_stat_index = 1;
        //if class daily-challenge exists, index is 2
        if (document.getElementsByClassName("daily-challenge").length > 0) {
            profile_stat_index = 2;
        }
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
        userTagParent.setAttribute("data-html-title", `<div>${clan.name}</div>`);
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
                        <p style="margin-bottom: 0px; font-size: 22px;">Member of <a href="https://score.kirino.sh/clan/${user_clan.clan.id}" target="_blank"><span style='color:#${user_clan.clan.color}'>[${user_clan.clan.tag}]</span> ${user_clan.clan.name}</a></p>
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
            banner.style.backgroundImage = `url(${image})`;
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

        const layout = document.getElementsByClassName("js-react--profile-page osu-layout osu-layout--full")[0];
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

        //also add left/right padding
        new Chart(ctx, data);
    }

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
})();
