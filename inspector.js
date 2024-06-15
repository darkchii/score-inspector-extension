// ==UserScript==
// @name         osu! scores inspector
// @namespace    https://score.kirino.sh
// @version      2024-05-24
// @description  Display osu!alt and scores inspector data on osu! website
// @author       Amayakase
// @match        http://osu.ppy.sh/users/*
// @match        https://osu.ppy.sh/users/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ppy.sh
// @noframes
// @grant        GM.xmlHttpRequest
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @require      https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js
// @require      https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0
// @downloadURL  https://github.com/darkchii/score-inspector-extension/blob/main/inspector.js
// ==/UserScript==

(function () {
    'use strict';

    const SCORE_INSPECTOR_API = "https://api.kirino.sh/inspector/";

    async function run() {
        if (window.location.href.includes("osu.ppy.sh/users")) {
            const startTime = new Date().getTime();
            while (document.getElementsByClassName("profile-info__name").length == 0) {
                if (new Date().getTime() - startTime > 5000) {
                    return;
                }
                await new Promise(r => setTimeout(r, 500));
            }

            await runUserPage();
        }
    }
    run();

    let previousLocation = location.href;
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (location.href !== previousLocation) {
                previousLocation = location.href;
                (async () => {
                    await new Promise(r => setTimeout(r, 1000));
                    //wait until the element with class "turbolinks-progress-bar" is gone
                    while (document.getElementsByClassName("turbolinks-progress-bar").length > 0) {
                        await new Promise(r => setTimeout(r, 100));
                    }
                })().then(() => {
                    run();
                })();
            }
        });
    });

    observer.observe(document, { childList: true, subtree: true });

    async function runUserPage() {
        //find profile-info__name
        const url = window.location.href;
        //remove trailing slash if it exists
        let fixedUrl = url.endsWith("/") ? url.slice(0, -1) : url;

        // const user_id = url.substring(url.lastIndexOf("/users/") + 7);
        const user_id = fixedUrl.match(/\/users\/(\d+)/)[1];

        //after user_id, there may be a /osu, /taiko, /fruits or /mania, check for it. If none, it's osu
        let mode = fixedUrl.match(/\/users\/\d+\/(osu|taiko|fruits|mania)/);
        mode = mode ? mode[1] : "osu";

        const data = await getUserData(user_id);
        console.log(data);

        if (data.user_data?.inspector_user?.clan_member) {
            setOrCreateUserClanTagElement(data.user_data.inspector_user.clan_member.clan);
            setOrCreateUserClanBannerElement(data.user_data.inspector_user.clan_member.clan);
        }

        if (mode === "osu") {
            if (data.stats_data) {
                setOrCreateStatisticsElements(data.stats_data);
                setNewRankGraph(data.stats_data.scoreRankHistory, data.stats_data.scoreRank);
            }
        }
    }

    async function getUserData(user_id) {
        //first we get /users/full/{user_id}
        const url = SCORE_INSPECTOR_API + "users/full/" + user_id + "?skipDailyData=true&skipOsuData=true&skipExtras=true";
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

        //then we get /users/stats/{user_id}
        const response2 = await fetch(SCORE_INSPECTOR_API + "users/stats/" + user_id, {
            headers: {
                "Access-Control-Allow-Origin": "*"
            }
        });
        const data2 = await response2.json();

        if (data2.error) {
            console.error(data2.error);
            return;
        }

        const _stats = {
            ...data2.stats,
            scoreRankHistory: data2.scoreRankHistory
        }

        return { user_data: data, stats_data: _stats };
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
                const rankText = document.createTextNode(Number(data[rank.toLowerCase()]).toLocaleString());
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

        const profile_detail__values = document.getElementsByClassName("profile-detail__values")[1];

        var clearsDisplay = getValueDisplay("Clears", Number(data.clears).toLocaleString());
        profile_detail__values.appendChild(clearsDisplay);

        var completionDisplay = getValueDisplay("Completion", `${(data.completion ?? 0).toFixed(2)}%`);
        profile_detail__values.appendChild(completionDisplay);

        var top50sDisplay = getValueDisplay("Top 50s", Number(data.top50s ?? 0).toLocaleString());
        profile_detail__values.appendChild(top50sDisplay);
    }

    function getValueDisplay(label, value) {
        var div = document.createElement("div");
        div.className = "value-display value-display--plain";
        var labelDiv = document.createElement("div");
        labelDiv.className = "value-display__label";
        labelDiv.textContent = label;
        div.appendChild(labelDiv);
        var valueDiv = document.createElement("div");
        valueDiv.className = "value-display__value";
        valueDiv.textContent = value;
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
        overlay.style.paddingTop = "4px";
        overlay.style.paddingLeft = "20px";
        clanBanner.appendChild(overlay);

        //clan tag
        var clanTag = document.createElement("div");
        clanTag.style.color = "white";
        clanTag.style.fontWeight = "bold";
        clanTag.style.fontSize = "20px";
        clanTag.innerHTML = `<p>Clan member of <span style='color:#${clan.color}'>[${clan.tag}]</span> ${clan.name}</p>`;
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
        scoreRankData = cloned_rank_history;

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

            //Toggle link
            const toggleLink = document.createElement("a");
            toggleLink.href = "javascript:void(0)";
            toggleLink.textContent = "Toggle PP Rank";
            toggleLink.style.color = "#fc2";
            toggleLink.style.textDecoration = "underline";
            toggleLink.style.fontSize = "12px";
            toggleLink.style.marginTop = "5px";
            toggleLink.style.display = "block";
            toggleLink.onclick = () => {
                if (activeChart === 'pp') {
                    updateGraph(scoreRankData, "Score Rank");
                    activeChart = 'score';
                    toggleLink.textContent = "Go to performance rank";
                } else {
                    updateGraph(ppRankData, "PP Rank");
                    activeChart = 'pp';
                    toggleLink.textContent = "Go to score rank";
                }
            }
            toggleLink.textContent = "Go to score rank";

            //disable and strikethrough the link if there is no score rank data
            if (!scoreRankData || scoreRankData.length === 0) {
                toggleLink.style.pointerEvents = "none";
                toggleLink.style.textDecoration = "line-through";
            }


            chartParent.insertBefore(chartOwner, chartParent.children[1]);
            chartOwner.appendChild(toggleLink);
        }

        updateGraph(ppRankData, "PP Rank");
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
                        hoverBorderWidth: 5,
                    }
                },
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
})();