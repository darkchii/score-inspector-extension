import { getUserData } from "./api";
import { getValue, setValue } from "./gm_api";
import { MODE_NAMES, MODE_SLUGS, searchElementForAttribute, WaitForElement } from "./helpers";
import type { IAltUserData, ICompletionistData, IScoreRankHistoryEntry } from "./types/user";
import config from "./config.json";
import type { ITeam } from "./types/team";
import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    TimeScale,
    Tooltip,
    type ChartConfiguration
} from 'chart.js';

import 'chartjs-adapter-date-fns';

Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    TimeScale,
    Tooltip
);

const PAGE_ELEMENT_WAIT_LIST = {
    'user_page': '.profile-info__name',
}

export async function runUserPage() {
    const url = window.location.href;
    let fixedUrl = url.endsWith("/") ? url.slice(0, -1) : url;
    let user_id: string | null = null;
    try {
        user_id = (fixedUrl.match(/\/users\/(\d+)/)?.[1] as string) || null;
    } catch (e) { }
    if (!user_id) {
        return;
    }

    let modeReg: RegExpMatchArray | null = fixedUrl.match(/\/users\/\d+\/(osu|taiko|fruits|mania)/);
    let mode: string = modeReg ? (modeReg[1] as string) : "osu";

    //wait for game-mode-link--active to load
    await WaitForElement(".game-mode-link--active");

    const activeModeElement = document.getElementsByClassName("game-mode-link game-mode-link--active")[0];
    if (activeModeElement) {
        mode = activeModeElement.getAttribute("data-mode") as string;
    }

    await WaitForElement(PAGE_ELEMENT_WAIT_LIST.user_page);

    const username: string | undefined = document.getElementsByClassName("profile-info__name")?.[0]?.getElementsByTagName("span")?.[0]?.textContent;

    if (!username) {
        console.error("Could not find username on user page");
        return;
    }

    const data: IAltUserData | null = await getUserData(user_id, mode);


    const user_exists = data?.user != null;

    if (!user_exists) {
        console.warn("User data not found for user id: ", user_id);
        return;
    }

    if (getValue("teams_show_team_tags", true) && data.team) {
        setOrCreateUserTeamTagElement(data.team);
    }

    if (data.completion) {
        setCompletionistBadges(data.completion);
    }

    if (data && Object.keys(data).length > 1) {
        setNewRankGraph(data.scoreRankHistory, data.stats?.scoreRank, user_exists);

        //if the user does not exist, give informational alert.
        if (!user_exists) {
            //skip other checks as redundant
            return;
        }
        setOrCreateStatisticsElements(data, mode);
    }
}

function setCompletionistBadges(completion_data: ICompletionistData[]) {
    if (!completion_data || completion_data.length === 0) {
        return;
    }

    //check if we have a badge area already (class "profile-badges"), otherwise create it
    var badgeArea = document.getElementsByClassName("profile-badges")[0];

    if (!badgeArea) {
        badgeArea = document.createElement("div");
        badgeArea.className = "profile-badges";

        //insert it before "profile-detail"
        const profileDetail = document.getElementsByClassName("profile-detail")?.[0];
        profileDetail?.parentNode?.insertBefore(badgeArea, profileDetail);
    }

    if (!badgeArea) {
        console.error("Could not find or create badge area");
        return;
    }

    //order newest to oldest
    completion_data.sort((a, b) => new Date(b.completion_date).getTime() - new Date(a.completion_date).getTime());

    //create a badge for each completionist badge
    completion_data.forEach(badge => {
        if (badgeArea!.querySelector(`img[src='https://assets.ppy.sh/profile-badges/completionist_${MODE_SLUGS[badge.mode]}.png']`)) {
            return;
        }

        var a = document.createElement("a");
        // a.href = `https://score.kirino.sh/completionists`;
        a.href = `${config.INSPECTOR_SITE_URL}completionists`;

        badgeArea!.appendChild(a);

        const date_object = new Date(badge.completion_date);
        const pretty_date = new Date(date_object).toLocaleDateString();

        var img = document.createElement("img");
        img.src = `https://assets.ppy.sh/profile-badges/completionist_${MODE_SLUGS[badge.mode]}.png`;
        img.className = "profile-badges__badge";
        a.setAttribute("data-html-title", `
                    <div>${MODE_NAMES[badge.mode]} completionist (awarded ${pretty_date})</div>
                    <div>Scores: ${badge.scores.toLocaleString()}</div>
                    <div class='profile-badges__date'>${date_object.toLocaleDateString("en-US", {
            month: 'long',
            day: '2-digit',
            year: 'numeric'
        })}</div>
                `);

        a.title = `${MODE_NAMES[badge.mode]} completionist (awarded ${pretty_date})`

        a.appendChild(img);
    });

    const badges: HTMLElement[] = Array.from(badgeArea.children) as HTMLElement[];
    if (badges && badges.length > 1) {
        for (let i = badges.length - 1; i > 0; i--) {
            const current = badges[i];
            const previous = badges[i - 1];

            //find both 'data-html-title' attributes in the current and next tree, may be on the element or any child element
            let current_data_html_title = searchElementForAttribute(current as HTMLElement, "data-html-title");
            let previous_data_html_title = searchElementForAttribute(previous as HTMLElement, "data-html-title");

            //find profile-badges__date
            const dateCurrent = current_data_html_title?.match(/<div class='profile-badges__date'>(.*?)<\/div>/)?.[1] ?? "";
            const datePrevious = previous_data_html_title?.match(/<div class='profile-badges__date'>(.*?)<\/div>/)?.[1] ?? "";

            //if previous is older than current, swap them
            if (new Date(datePrevious) < new Date(dateCurrent)) {
                badgeArea.insertBefore(current!, previous!);
            }
        }
    }
}

function setOrCreateStatisticsElements(data: IAltUserData, mode: string) {
    if (!data?.user) {
        console.error("User data is null, cannot set statistics elements");
        return;
    }

    const parent: HTMLElement | null = document.getElementsByClassName("profile-rank-count")[0] as HTMLElement | null;

    if (!parent) {
        console.error("Could not find parent element for statistics elements");
        return;
    }

    if (getValue("profile_show_extra_grades", true)) {
        //create the elements if they don't exist
        const ranks = ["B", "C", "D"];
        // const ranks = gradeKeys.map((key: string) => key.replace("{mode}", mode)) as string[];
        ranks.forEach(rank => {
            //if element exists, delete it
            let existingElement = document.getElementById(`inspector_elm_${rank.toLowerCase()}`);
            if (existingElement) {
                existingElement.remove();
            }

            var b = document.createElement("div");
            b.id = `inspector_elm_${rank.toLowerCase()}`;
            var div = document.createElement("div");
            div.className = `score-rank score-rank--${rank} score-rank--profile-page`;
            b.appendChild(div);
            let rankText = null;
            let valueName = `${mode}_grade_counts_${rank.toLowerCase()}`;
            let value: number | undefined = data.user![valueName as keyof typeof data.user] as unknown as number | undefined;
            if (value !== undefined && !isNaN(value)) {
                rankText = document.createTextNode(Number(value).toLocaleString());
            } else {
                rankText = document.createTextNode('-');

                //add a tooltip to explain the rank is not available
                b.setAttribute("data-html-title", `<div>Data not available</div>`);
                b.setAttribute("title", "");
            }
            b.appendChild(rankText);
            parent.appendChild(b);
        });

        //find the parent of score-rank--A
        var aParent = document.getElementsByClassName("score-rank--A")[0]?.parentNode;

        if (!aParent) {
            console.error("Could not find parent element for score-rank--A");
            return;
        }

        //add an element before aParent to force the next elements to be on the next line
        var br = document.createElement("div");
        //flex expand
        br.style.flexBasis = "100%";
        aParent.parentNode!.insertBefore(br, aParent);

        //align all the elements to the right
        parent.style.justifyContent = "flex-end";
    }

    const profile_detail__rank = document.getElementsByClassName("profile-detail__values")[0];
    let profile_stat_index = 2;
    //if class daily-challenge exists, index is 2
    // if (document.getElementsByClassName("daily-challenge").length > 0) {
    //     profile_stat_index = 2;
    // }
    const profile_detail__values = document.getElementsByClassName("profile-detail__values")[profile_stat_index];

    if (!profile_detail__values) {
        console.error("Could not find profile detail values element");
        return;
    }

    const clears = data.user ? (
        (data.user[`${mode}_grade_counts_ssh` as keyof typeof data.user] as number) +
        (data.user[`${mode}_grade_counts_ss` as keyof typeof data.user] as number) +
        (data.user[`${mode}_grade_counts_sh` as keyof typeof data.user] as number) +
        (data.user[`${mode}_grade_counts_s` as keyof typeof data.user] as number) +
        (data.user[`${mode}_grade_counts_a` as keyof typeof data.user] as number) +
        (data.user[`${mode}_grade_counts_b` as keyof typeof data.user] as number) +
        (data.user[`${mode}_grade_counts_c` as keyof typeof data.user] as number) +
        (data.user[`${mode}_grade_counts_d` as keyof typeof data.user] as number)) : NaN;
    var clearsDisplay = getValueDisplay("inspector_elm_clears", "Clears", clears ? Number(clears).toLocaleString() : null, false);
    let inspector_elm_clears = document.getElementById("inspector_elm_clears");
    if (inspector_elm_clears) {
        inspector_elm_clears.remove();
    }
    profile_detail__values.appendChild(clearsDisplay);

    var completionDisplay = getValueDisplay("inspector_elm_completion", "Completion", !isNaN(clears) ? `${(data.user?.completion ?? 0).toFixed(2)}%` : "NaN");
    let inspector_elm_completion = document.getElementById("inspector_elm_completion");
    if (inspector_elm_completion) {
        inspector_elm_completion.remove();
    }
    profile_detail__values.appendChild(completionDisplay);
}

function getValueDisplay(id: string, label: string, value: string | number | null, is_rank = false, tooltip: string | null = null) {
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

function setOrCreateUserTeamTagElement(team: ITeam) {
    var userTagElement = document.getElementById("inspector_user_tag");
    var userTagParent: HTMLElement | null = null;

    if (!userTagElement) {
        var profileNameParentNode = document.getElementsByClassName("profile-info__name")[0];
        userTagElement = profileNameParentNode?.childNodes[0]?.cloneNode(true) as HTMLElement;
        userTagElement.id = "inspector_user_tag";

        var div = document.createElement("a");
        div.style.display = "inline";
        div.style.textDecoration = "none";
        div.appendChild(userTagElement);

        userTagParent = div;
        if (profileNameParentNode?.childNodes?.[0]) {
            profileNameParentNode?.insertBefore(div, profileNameParentNode?.childNodes?.[0]);
        }
    } else {
        userTagParent = userTagElement.parentNode as HTMLElement;
    }

    userTagElement.textContent = `[${team.short_name}]`;
    userTagElement.style.color = `${team.color}`;
    userTagElement.style.marginRight = "5px";
    userTagElement.style.fontWeight = "bold";

    userTagParent.setAttribute("data-html-title", `<div>${team.name}</div>`);
    userTagParent.setAttribute("title", "");
    (userTagParent as HTMLAnchorElement).href = `https://osu.ppy.sh/teams/${team.id}`;
    (userTagParent as HTMLAnchorElement).target = "_blank";
}

let CURRENT_GRAPH = getValue("inspector_current_graph", "Performance");
const GRAPHS = ["Performance", "Score"];

let activeChart: string = 'pp';
let ppRankData: { date: Date; rank: number }[] | null = null;
let scoreRankData: IScoreRankHistoryEntry[] | null = null;
let graphHue: number = 0;
function setNewRankGraph(scoreRankHistory: IScoreRankHistoryEntry[] | null, currentRank: number | undefined, reorder_elements: boolean) {
    const TODAY = new Date();

    const cloned_rank_history = [...scoreRankHistory ?? []];
    if (currentRank) {
        cloned_rank_history.push({
            ...cloned_rank_history[cloned_rank_history.length - 1],
            //date as YYYY-MM-DD
            date: new Date().toISOString().split('T')[0],
            rank: currentRank
        });
    }

    const layouts = document.getElementsByClassName("js-react u-contents");
    //find the one with data-initial-data attribute
    let layout: HTMLElement | null = null;
    for (let i = 0; i < layouts.length; i++) {
        if (layouts?.[i]?.getAttribute("data-initial-data")) {
            layout = layouts[i] as HTMLElement;
            break;
        }
    }
    if (!layout) {
        console.error("Could not find layout with data-initial-data");
        return;
    }
    const data: string | null = layout.getAttribute("data-initial-data");
    const parsedData = JSON.parse(data as string);

    if (!parsedData || !parsedData.user) {
        console.error("Could not parse user data from layout");
        return;
    }

    graphHue = parsedData.user.profile_hue;
    const rankHistory = parsedData.user.rank_history.data ?? parsedData.user.rankHistory.data ?? [];

    //generate data for pp rank (array is a simple number array [0,5,25,7763,...] sorted oldest to newest, 89d ago to today, convert it to object array {date,rank})
    const pp_ranks_filled: { date: Date; rank: number }[] = [];
    rankHistory.reverse().forEach((rank: number, i: number) => {
        const date = new Date(TODAY.getTime() - (1000 * 60 * 60 * 24) * i);
        pp_ranks_filled.push({ date, rank });
    });

    ppRankData = pp_ranks_filled;

    //if no pp rank data, or last pp rank is 0, then return;
    if (!ppRankData || ppRankData.length === 0 || ppRankData?.[0]?.rank === 0) {
        return;
    }

    scoreRankData = (cloned_rank_history && cloned_rank_history.length > 2) ? cloned_rank_history : null;

    //find with class "line-chart line-chart--profile-page"
    const lineChart = document.getElementsByClassName("profile-detail__chart")[0];
    if (lineChart) {
        const chartParent = lineChart.parentNode;

        if (!chartParent) {
            console.error("Could not find parent of line chart");
            return;
        }

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

        const getRankSet = (graph: string) => {
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
                let span: HTMLElement = document.createElement(CURRENT_GRAPH === graph ? "span" : "a");
                // span.style.color = CURRENT_GRAPH !== graph ? "#fc2" : "white";
                span.style.color = CURRENT_GRAPH !== graph ? (graphHue ? `hsl(${graphHue}, 40%, 80%)` : "#fc2") : "white";
                if (CURRENT_GRAPH !== graph) {
                    (span as HTMLAnchorElement).href = "javascript:void(0)";
                    span.style.textDecoration = "underline";
                    if (graphData) {
                        span.onclick = () => {
                            updateGraph(graphData, graph);
                            CURRENT_GRAPH = graph;
                            setValue("inspector_current_graph", CURRENT_GRAPH);
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

        const chartOwnerBeforeElement = chartParent.children?.[1];
        const chartLinkBeforeElement = chartParent.children?.[1];
        if (!chartOwnerBeforeElement || !chartLinkBeforeElement) {
            console.error("Could not find reference elements for inserting chart and toggle link");
            return;
        }

        chartParent!.insertBefore(chartOwner, chartOwnerBeforeElement);
        //insert the toggle after the chart
        chartParent!.insertBefore(toggleLink, chartLinkBeforeElement);

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

const getOrCreateTooltip = (chart: any) => {
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

const externalTooltipHandler = (context: any) => {
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
        const bodyLines = tooltip.body.map((b: any) => b.lines);

        const tableHead = document.createElement('thead');

        titleLines.forEach((title: string) => {
            const tr: HTMLTableRowElement = document.createElement('tr');
            tr.style.borderWidth = '0';

            const th: HTMLTableCellElement = document.createElement('th');
            th.style.borderWidth = '0';
            const text = document.createTextNode(title);

            th.appendChild(text);
            tr.appendChild(th);
            tableHead.appendChild(tr);
        });

        const tableBody = document.createElement('tbody');
        bodyLines.forEach((body: string[], i: number) => {
            const colors = tooltip.labelColors[i];

            const span = document.createElement('span');
            span.style.background = colors.backgroundColor;
            span.style.borderColor = colors.borderColor;
            span.style.borderWidth = '2px';
            span.style.marginRight = '10px';
            span.style.height = '10px';
            span.style.width = '10px';
            span.style.display = 'inline-block';

            const tr: HTMLTableRowElement = document.createElement('tr');
            tr.style.backgroundColor = 'inherit';
            tr.style.borderWidth = '0';

            const td: HTMLTableCellElement = document.createElement('td');
            td.style.borderWidth = '0';

            // const text = document.createTextNode(body);
            const _text = document.createTextNode(body.join(' '));

            td.appendChild(span);
            td.appendChild(_text);
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

let _chart: Chart | null = null;
let _chart_data: ChartConfiguration<'line'> | null = null;
function updateGraph(rank_data: any[], rank_type: string) {
    let ctx = document.getElementById("custom_rank_chart") as HTMLCanvasElement;
    //destroy previous chart
    if (ctx) {
        let _clone = ctx.cloneNode(true) as HTMLCanvasElement;
        ctx.parentNode!.replaceChild(_clone, ctx);
        ctx = _clone;
    }

    const data: ChartConfiguration<'line'> = {
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
                    // grace: '10%',
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
                        title: function (context: any) {
                            // return context[0].raw;
                            // return new Date(context[0].parsed.x).toLocaleDateString();
                            //show days ago / today
                            const date = context[0].parsed.x;
                            const today = new Date();
                            const days = Math.floor((today.getTime() - date) / (1000 * 60 * 60 * 24));
                            if (days === 0)
                                return "Today";
                            return `${days} day${days > 1 ? "s" : ""} ago`;
                        },
                        label: function (context: any) {
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