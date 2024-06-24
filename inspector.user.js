// ==UserScript==
// @name         osu! scores inspector
// @namespace    https://score.kirino.sh
// @version      2024-06-24.22
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

    // let CURRENT_GRAPH = 'Performance';
    let CURRENT_GRAPH = GM_getValue("inspector_current_graph", "Performance");

    document.addEventListener("turbolinks:load", async function () {
        await run();
    });

    //lets script know what elements to wait for before running
    const PAGE_ELEMENT_WAIT_LIST = {
        'user_page': '.profile-info__name',
    }

    async function run() {

        //if userpage
        if (window.location.href.includes("/users/")) {
            //override css font-size for class "value-display__value"
            GM_addStyle(`
                .value-display--rank .value-display__value {
                    font-size: 20px;
                }

                .value-display__label {
                    font-size: 12px;
                }
            `);
        }

        await runUserPage();
        await runUsernames();
        await runScoreRankCompletionPercentages();
    }
    run();

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
                    await WaitForElement('.osu-plus', 1000); //osu-plus updates leaderboards, so we wait for it in case user has it enabled
                }
                const usercards = document.getElementsByClassName("js-usercard");
                const user_ids = Array.from(usercards).map(card => card.getAttribute("data-user-id"));
                //unique user ids
                const clan_data = await getUsersClans(user_ids.filter((v, i, a) => a.indexOf(v) === i));

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
                    if (window.location.href.includes("/beatmapsets/")) {
                        if (mutation.target.classList.contains("beatmapset-scoreboard__main")) {
                            _func();
                        }
                    }

                    if (window.location.href.includes("/community/chat")) {
                        if (mutation.target.classList.contains("chat-conversation")) {
                            _func();
                        }
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    function modifyJsUserCards(clan_data) {
        let usercards = document.querySelectorAll("[class*='js-usercard']");
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
            //get the user id from the data-user-id attribute
            const user_id = usercards[i].getAttribute("data-user-id");
            const user_clan_data = clan_data.find(clan => clan.osu_id == user_id);

            if (!user_clan_data) {
                continue;
            }

            //get content of the element (the username)
            let username = usercards[i].textContent;
            //trim the username
            username = username.trim();

            //create a span element ([clan_tag] username), set the color and url to the clan tag
            const clanTag = document.createElement("a");
            clanTag.textContent = `[${user_clan_data.clan.tag}] `;
            clanTag.style.color = `#${user_clan_data.clan.color}`;
            clanTag.style.fontWeight = "bold";
            clanTag.href = `https://score.kirino.sh/clan/${user_clan_data.clan.id}`;
            clanTag.target = "_blank";
            //force single line
            clanTag.style.whiteSpace = "nowrap";
            //set id
            clanTag.classList.add("inspector_user_tag");

            //if usercard has class "beatmap-scoreboard-table__cell-content" along with it, add whitespace-width padding
            if (usercards[i].classList.contains("beatmap-scoreboard-table__cell-content")) {
                clanTag.style.paddingRight = "5px";
            }

            //if usercard has a "user-card-brick__link" child, insert the clan tag in there at index 1
            const usercardLink = usercards[i].getElementsByClassName("user-card-brick__link")[0];
            if (usercardLink) {
                //first check if one exists already
                if (usercardLink.getElementsByClassName("inspector_user_tag").length > 0) {
                    continue;
                }
                clanTag.style.marginRight = "5px";
                usercardLink.insertBefore(clanTag, usercardLink.childNodes[1]);
                //if usercard has parent with class "chat-message-group__sender"
            } else if (usercards[i].parentElement.classList.contains("chat-message-group__sender")) {
                //check if one exists already
                if (usercards[i].parentElement.getElementsByClassName("inspector_user_tag").length > 0) {
                    continue;
                }

                const parent = usercards[i].parentElement;
                //find child in parent with class "chat-message-group__username"
                const usernameElement = parent.getElementsByClassName("chat-message-group__username")[0];
                //insert clan tag in usernameElement before the text
                usernameElement.insertBefore(clanTag, usernameElement.childNodes[0]);
            } else {
                //check if one exists already
                if (usercards[i].getElementsByClassName("inspector_user_tag").length > 0) {
                    continue;
                }
                usercards[i].insertBefore(clanTag, usercards[i].childNodes[0]);
            }

            //also add an event listener to the usercards to update the clan tag when the usercard is updated
            //other extensions might update the usercard after the page is loaded
            //this causes the clan tag to disappear

            // MutationObserver to detect changes in the usercard
            const observer = new MutationObserver((mutationsList, observer) => {
                for (let mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        //if the usercard is updated, re-add the clan tag
                        if (mutation.target.classList.contains("js-usercard")) {
                            //only clan_data of the user
                            const sub_clan_data = clan_data.find(clan => clan.osu_id == mutation.target.getAttribute("data-user-id"));
                            modifyJsUserCards(sub_clan_data);
                            observer.disconnect();
                        }
                    }
                }
            });

            observer.observe(usercards[i], { childList: true });
        }
    }

    //replaces the accuracy column with a completion percentage column
    async function runScoreRankCompletionPercentages() {
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
            }
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

        // const startTime = new Date().getTime();
        // while (document.getElementsByClassName("profile-info__name").length == 0) {
        //     if (new Date().getTime() - startTime > 5000) {
        //         return;
        //     }
        //     await new Promise(r => setTimeout(r, 500));
        // }

        const data = await getUserData(user_id, username, mode);

        if (data.user_data?.inspector_user?.clan_member && !data.user_data?.inspector_user?.clan_member?.pending) {
            setOrCreateUserClanTagElement(data.user_data.inspector_user.clan_member.clan);
            setOrCreateUserClanBannerElement(data.user_data.inspector_user.clan_member.clan);
        }

        if (data.stats_data?.completionists) {
            setCompletionistBadges(data.stats_data.completionists);
        }

        if (data.stats_data) {
            setOrCreateStatisticsElements(data.stats_data);
            setNewRankGraph(data.stats_data.scoreRankHistory, data.stats_data.scoreRank);
        }
    }

    async function WaitForElement(selector, timeout = 5000) {
        const startTime = new Date().getTime();
        while (document.querySelectorAll(selector).length == 0) {
            if (new Date().getTime() - startTime > timeout) {
                return null;
            }
            await new Promise(r => setTimeout(r, 500));
        }
    }

    let _userClansCache = [];
    async function getUsersClans(user_ids) {
        // //first get all the cached users
        let cached_users = [];
        if (_userClansCache.length > 0) {
            for (let i = 0; i < user_ids.length; i++) {
                const user = _userClansCache.find(c => c.osu_id == user_ids[i]);
                if (user) {
                    cached_users.push(user);
                }
            }
        }

        // filter out the cached users from the user_ids
        if (cached_users.length > 0) {
            user_ids = user_ids.filter(id => !cached_users.find(c => c.osu_id == id));
        }

        let uncached_users = [];
        if (user_ids.length > 0) {
            const url = SCORE_INSPECTOR_API + "clans/user/" + user_ids.join(",");
            const response = await fetch(url, {
                headers: {
                    "Access-Control-Allow-Origin": "*"
                }
            });

            const data = await response.json();

            if (!data || data.error) {
                console.error(data?.error);
                uncached_users = [];
            } else {
                uncached_users = JSON.parse(JSON.stringify(data));
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
        let data = null;
        const url = SCORE_INSPECTOR_API + "users/full/" + user_id + "?skipDailyData=true&skipOsuData=true&skipExtras=true";
        const response = await fetch(url, {
            headers: {
                "Access-Control-Allow-Origin": "*"
            }
        });
        data = await response.json();

        //then we get /users/stats/{user_id}
        const response2 = await fetch(SCORE_INSPECTOR_API + `users/stats/${user_id}?mode=${modeIndex}&username=${username}`, {
            headers: {
                "Access-Control-Allow-Origin": "*"
            }
        });
        const data2 = await response2.json();

        const response3 = await fetch(SCORE_INSPECTOR_API + "users/osu/completionists", {
            headers: {
                "Access-Control-Allow-Origin": "*"
            }
        });
        const data3 = await response3.json();

        let completionist_data = [];
        if (data3 && !data3.error) {
            //find all where osu_id == user_id
            completionist_data = data3.filter(c => c.osu_id == user_id);
        }

        const _stats = {
            ...data2.stats,
            scoreRankHistory: data2.scoreRankHistory,
            completionists: completionist_data
        }

        return { user_data: data, stats_data: _stats };
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
            const count = document.getElementsByClassName(`score-rank--${rank} score-rank--profile-page`).length;
            if (!document.getElementsByClassName(`score-rank--${rank} score-rank--profile-page`).length) {
                var b = document.createElement("div");
                var div = document.createElement("div");
                div.className = `score-rank score-rank--${rank} score-rank--profile-page`;
                b.appendChild(div);
                let rankText = null;
                if (data[rank.toLowerCase()] !== undefined && !isNaN(data[rank.toLowerCase()])) {
                    rankText = document.createTextNode(Number(data[rank.toLowerCase()]).toLocaleString());
                } else {
                    rankText = document.createTextNode('-');

                    //add a tooltip to explain the rank is not available
                    b.setAttribute("data-html-title", `<div>Data not available</div>`);
                    b.setAttribute("title", "");
                }
                b.appendChild(rankText);
                parent.appendChild(b);
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

        console.log(data);

        const profile_detail__rank = document.getElementsByClassName("profile-detail__values")[0];
        const profile_detail__values = document.getElementsByClassName("profile-detail__values")[1];

        profile_detail__rank.style.gap = "10px";

        var clearsDisplay = getValueDisplay("Clears", Number(data.clears).toLocaleString());
        profile_detail__values.appendChild(clearsDisplay);

        var completionDisplay = getValueDisplay("Completion", !isNaN(data.clears) ? `${(data.completion ?? 0).toFixed(2)}%` : "NaN");
        profile_detail__values.appendChild(completionDisplay);

        var top50sDisplay = getValueDisplay("Top 50s", Number(data.top50s ?? 0).toLocaleString());
        profile_detail__values.appendChild(top50sDisplay);

        var globalSSrankDisplay = getValueDisplay("SS Ranking", Number(data.global_ss_rank).toLocaleString(), true, `Highest rank: #${Number(data.global_ss_rank_highest ?? 0).toLocaleString()} on ${data.global_ss_rank_highest_date ? new Date(data.global_ss_rank_highest_date).toLocaleDateString("en-GB", {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }) : "N/A"
            }`);
        profile_detail__rank.appendChild(globalSSrankDisplay);

        var countrySSrankDisplay = getValueDisplay("Country SS Ranking", Number(data.country_ss_rank).toLocaleString(), true, `Highest rank: #${Number(data.country_ss_rank_highest ?? 0).toLocaleString()} on ${data.country_ss_rank_highest_date ? new Date(data.country_ss_rank_highest_date).toLocaleDateString("en-GB", {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }) : "N/A"
            }`);
        profile_detail__rank.appendChild(countrySSrankDisplay);

        profile_detail__values.style.rowGap = "5px";
    }

    function getValueDisplay(label, value, is_rank = false, tooltip = null) {
        var div = document.createElement("div");
        div.className = `value-display value-display--${is_rank ? 'rank' : 'plain'}`;
        var labelDiv = document.createElement("div");
        labelDiv.className = "value-display__label";
        labelDiv.textContent = label;
        div.appendChild(labelDiv);
        var valueDiv = document.createElement("div");
        valueDiv.className = "value-display__value";
        if (value === 'NaN') {
            valueDiv.textContent = `${is_rank ? '#' : ''}-`;
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

    function setOrCreateUserClanBannerElement(clan) {
        //find data-page-id "main"
        const mainElement = document.querySelector("[data-page-id='main']");

        //find index of class "profile-cover profile-info--cover"
        const coverIndex = Array.from(mainElement.children).findIndex(child => child.classList.contains("profile-cover"));

        var clanBanner = document.getElementById("inspector_user_banner");
        if (clanBanner) {
            //remove it and re-add it
            clanBanner.remove();
        }
        clanBanner = document.createElement("div");

        clanBanner.style.width = "100%";
        clanBanner.style.height = "60px";
        // clanBanner.style.backgroundColor = `#${clan.color}`;
        if (clan.header_image_url) {
            clanBanner.style.backgroundImage = `url(${clan.header_image_url})`;
            clanBanner.style.backgroundSize = "cover";
            clanBanner.style.backgroundPosition = "center";
        }
        clanBanner.id = "inspector_user_banner";

        //text overlay
        var overlay = document.createElement("div");
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "left";
        overlay.style.paddingLeft = "50px";
        clanBanner.appendChild(overlay);

        //clan tag
        var clanTag = document.createElement("div");
        clanTag.style.color = "white";
        clanTag.style.fontWeight = "light";
        clanTag.style.fontSize = "20px";
        clanTag.innerHTML = `<p style="margin-bottom: 0px;">Clan member of <a href="https://score.kirino.sh/clan/${clan.id}" target="_blank"><span style='color:#${clan.color}'>[${clan.tag}]</span> ${clan.name}</a></p>`;
        overlay.appendChild(clanTag);

        //insert it after the cover
        mainElement.insertBefore(clanBanner, mainElement.children[coverIndex + 2]);
    }

    let activeChart = 'pp';
    let ppRankData = null;
    let scoreRankData = null;
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
                if(!scoreRankData || scoreRankData.length === 0){
                    CURRENT_GRAPH = "Performance";
                }
                GRAPHS.forEach(graph => {

                    const graphData = getRankSet(graph);
                    let span = document.createElement(CURRENT_GRAPH === graph ? "span" : "a");
                    span.style.color = CURRENT_GRAPH !== graph ? "#fc2" : "white";
                    if(CURRENT_GRAPH !== graph){
                        span.href = "javascript:void(0)";
                        span.style.textDecoration = "underline";
                        if(graphData){
                            span.onclick = () => {
                                updateGraph(graphData, graph);
                                CURRENT_GRAPH = graph;
                                GM_setValue("inspector_current_graph", CURRENT_GRAPH);
                                updateLinks();
                            }
                        }else{
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

            chartParent.insertBefore(chartOwner, chartParent.children[1]);
            //insert the toggle after the chart
            chartParent.insertBefore(toggleLink, chartParent.children[2]);

            //completely REMOVES the link if there is no score rank data
            // if (!scoreRankData || scoreRankData.length === 0) {
            //     toggleLink.remove();
            // }

        }

        if(scoreRankData && scoreRankData.length > 0){
            switch (CURRENT_GRAPH) {
                case "Performance":
                    updateGraph(ppRankData, "PP Rank");
                    break;
                case "Score":
                    updateGraph(scoreRankData, "Score Rank");
                    break;
            }
        }else{
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
                    borderColor: '#fc2',
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
