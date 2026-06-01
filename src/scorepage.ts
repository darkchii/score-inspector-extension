import { APIGetBeatmapAttributes, APIGetBeatmapScores } from "./api";
import { getValue } from "./gm_api";
import { countryCodeToUnicodeHex, formatNumber, getRulesetIconSpan, MODE_SLUGS_ALT } from "./helpers";
import { getModData, modsDataMakeSure } from "./modData";
import type { IBeatmapAttributes } from "./types/attributes";
import type { IBeatmap } from "./types/beatmap";
import type { IScore } from "./types/score";

export async function runScorePage() {
    if (!window.location.href.includes("/scores/")) {
        return;
    }

    try {
        await modsDataMakeSure();

        let score_id: string | number | undefined = window.location.href.split("/")[4];

        if (!score_id || !parseInt(score_id as string)) {
            console.error("Invalid score id");
            return;
        }
        score_id = parseInt(score_id as string);

        const active_score = await getScoreData();
        console.log("Active score: ", active_score);

        if (!active_score) {
            console.error("Failed to get score data");
            return;
        }

        //Apply the attributes to the current score view
        //get element class "score-stats__group score-stats__group--stats"
        const score_stats_group = document.getElementsByClassName("score-stats__group score-stats__group--stats")[0];

        if (!score_stats_group) {
            console.error("Score stats group not found");
            return;
        }

        const createStat = (name: string, value: string, light = false, title: string | null = null) => {
            const stat = document.createElement("div");
            stat.classList.add("score-stats__stat");

            const stat_name = document.createElement("div");
            stat_name.classList.add("score-stats__stat-row", "score-stats__stat-row--label");
            stat_name.textContent = name;
            stat.appendChild(stat_name);

            const stat_value = document.createElement("div");
            stat_value.classList.add("score-stats__stat-row");
            stat_value.textContent = value;
            if (light) {
                //italics
                stat_value.style.fontStyle = "italic";
                stat_value.style.color = "lightgray";
            }

            if (title) {
                //tooltip
                stat_value.setAttribute("title", title);
                stat_value.setAttribute("data-tooltip", title);
                stat_value.setAttribute("data-orig-title", title);
            }
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
        score_stats_group_row.appendChild(createStat("Stars", `${formatNumber(active_score.beatmap?.attributes?.star_rating ?? 0, 2)} ★`));
        switch (active_score.ruleset_id) {
            case 0: //osu
                score_stats_group_row.appendChild(createStat("Aim", `${formatNumber(active_score.beatmap?.attributes?.aim_difficulty ?? 0, 2)}★`));
                score_stats_group_row.appendChild(createStat("Speed", `${formatNumber(active_score.beatmap?.attributes?.speed_difficulty ?? 0, 2)}★`));
                score_stats_group_row.appendChild(createStat("Flashlight", `${formatNumber(active_score.beatmap?.attributes?.flashlight_difficulty ?? 0, 2)}★`));
                break;
        }

        const score_stats_group_row_top = document.getElementsByClassName("score-stats__group-row")[0];
        if (!score_stats_group_row_top) {
            console.error("Score stats group row not found");
            return;
        }

        if (getValue("score_page_show_user_scores", true)) {
            let ruleset_scores: { [key: string]: IScore[] } = {};

            const score_stats = document.getElementsByClassName("score-stats")[0];
            if (!score_stats) {
                console.error("Score stats not found");
                return;
            }

            //get scores for all rulesets
            for (const ruleset of MODE_SLUGS_ALT) {
                const data: IScore[] | null = await getUserBeatmapScores(active_score.user_id, active_score.beatmap_id, ruleset);

                //sort data by .pp desc
                if (data) {
                    data.sort((a, b) => b.pp - a.pp);
                    ruleset_scores[ruleset] = data;
                }
            }

            let extra_scores_div = document.getElementById("score-stats__group-row--extra-scores");
            if (extra_scores_div) {
                extra_scores_div.remove();
            }
            extra_scores_div = document.createElement("div");
            extra_scores_div.classList.add("score-stats");
            extra_scores_div.id = "score-stats__group-row--extra-scores";
            //force full width
            extra_scores_div.style.width = "100%";

            score_stats.parentNode!.insertBefore(extra_scores_div, score_stats.nextSibling);

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
                    const ruleset_id = MODE_SLUGS_ALT.indexOf(ruleset);

                    const proxy_scoreboard_item_element = document.createElement("div");
                    proxy_scoreboard_item_element.classList.add("beatmapset-scoreboard__main");

                    const ruleset_scores_container = document.createElement("div");
                    ruleset_scores_container.classList.add("beatmap-scoreboard-top__item");
                    proxy_scoreboard_item_element.appendChild(ruleset_scores_container);

                    // ruleset_scores_container.innerHTML = `<h3>${ruleset}</h3>`;
                    // extra_scores_div.appendChild(ruleset_scores_container);
                    const ruleset_scores_header = document.createElement("h4");
                    ruleset_scores_header.classList.add("ruleset-scores-header");

                    ruleset_scores_header.appendChild(getRulesetIconSpan(ruleset_id));

                    const ruleset_scores_header_text = document.createElement("span");
                    ruleset_scores_header_text.textContent = ` ${ruleset}`;
                    ruleset_scores_header.appendChild(ruleset_scores_header_text);

                    ruleset_scores_container.appendChild(ruleset_scores_header);
                    proxy_scoreboard_element.appendChild(proxy_scoreboard_item_element);

                    for (const [index, score] of ruleset_scores[ruleset].entries()) {
                        const score_element = getUserScoreElement(score, active_score.user, index);
                        if (!score_element) continue;

                        if (active_score.id == score.id) {
                            //add a subtle gold glow to the score element
                            //not a class, use inline style
                            score_element.style.boxShadow = "0 0 10px 5px rgba(255, 215, 0, 0.5)";
                        }

                        ruleset_scores_container.appendChild(score_element);
                    }
                }
            }
        }
    } catch (err) {
        console.error(err);
    }
}

function getUserScoreElement(score: IScore, user: any, index: number): HTMLDivElement | null {
    if (!score.beatmap) {
        console.error("Score beatmap data is missing");
        return null;
    }

    let time_ago = null;
    let time_ago_long = null;
    //time_ago is a simple string i.e: 2d (2 days ago), 1m (1 month ago), 1y (1 year ago)
    if (score.ended_at) {
        const date = new Date(score.ended_at);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
        const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
        if (days <= 0) {
            time_ago = "now";
            time_ago_long = "now";
        } else if (days <= 30) {
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
    score_stat_group_acc_parent.appendChild(getScoreStatElement("Max Combo", score.max_combo, score.max_combo == (score.beatmap.attributes?.max_combo ?? score.beatmap.max_combo) ? 'perfect' : '', (value) => { return `${value.toLocaleString()}x`; }));

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

function getScoreStatElement(header: string, value: any, type: string | null = null, formatter: ((value: any) => string) | null = null, data: any = {}) {
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
        let MOD_DATA = getModData();
        if (!MOD_DATA || (!MOD_DATA[MODE_SLUGS_ALT[data.ruleset!]!])) {
            console.error(`Mod data not found for ruleset ${data.ruleset}`);
            value_element.textContent = 'Mod Error';
            return element;
        }
        //only slightly more complex
        let mod_set = MOD_DATA[MODE_SLUGS_ALT[data.ruleset!]!];
        for (const mod of value) {
            //find the mod_data where Acronym == mod.acronym
            const mod_data = mod_set?.find(m => m.Acronym == mod.acronym);
            if (!mod_data) {
                console.error("Mod data not found", mod.acronym);
                continue;
            }

            const mod_parent_element = document.createElement("div");
            mod_parent_element.classList.add('mod', `mod--type-${mod_data.Type}`);

            const mod_element = document.createElement("div");
            mod_element.classList.add("mod__icon", `mod__icon--${mod_data.Acronym}`);
            mod_element.setAttribute("data-acronym", mod_data.Acronym);
            mod_element.setAttribute("data-title", mod_data.Name);
            mod_element.setAttribute("title", mod_data.Name);
            mod_parent_element.appendChild(mod_element);
            value_element.appendChild(mod_parent_element);
        }
    }
    value_element.classList.add("beatmap-score-top__stat-value", `beatmap-score-top__stat-value${type ? `--${type}` : ""}`);
    //set margin-top to 0px
    value_element.style.marginTop = "0px";

    element.appendChild(header_element);
    element.appendChild(value_element);

    return element;
}

function getUserScoreElementPlayer(score: IScore, user: any, time_ago: string | null): HTMLDivElement {
    const user_box = document.createElement("div");
    user_box.classList.add("beatmap-score-top__user-box");

    const user_name_element = document.createElement("a");
    user_name_element.classList.add("js-usercard", "beatmap-score-top__username", "u-hover");
    user_name_element.href = `https://osu.ppy.sh/users/${score.user_id}`;
    user_name_element.target = "_blank";
    user_name_element.rel = "noopener noreferrer";
    user_name_element.setAttribute("data-user-id", score.user_id.toString());
    user_name_element.textContent = user.username;
    user_box.appendChild(user_name_element);

    const date_played_element = document.createElement("div");
    date_played_element.classList.add("beatmap-score-top__achieved", "u-hover");
    date_played_element.textContent = "achieved " + time_ago;
    date_played_element.setAttribute("title", `${new Date(score.ended_at).toLocaleString()}`);
    // const date_played_time_element = document.createElement("time");
    // date_played_time_element.classList.add("js-timeago");
    // date_played_time_element.setAttribute("title", score.ended_at.toString());
    // date_played_time_element.setAttribute("datetime", score.ended_at.toString());
    // date_played_element.appendChild(date_played_time_element);
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
    country_flag_sub_element.setAttribute("title", user.country.name);
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
        team_flag_sub_element.setAttribute("title", user.team.name);
        team_flag_sub_element.setAttribute("data-orig-title", user.team.name);
        team_flag_element.appendChild(team_flag_sub_element);
        flags_container_element.appendChild(team_flag_element);
    }

    return user_box;
}

function getUserScoreElementPosition(score: IScore, index: number): HTMLDivElement {
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

async function getScoreData(): Promise<IScore | null> {
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

        let attributes = await APIGetBeatmapAttributes(score.beatmap_id, score.ruleset_id, score.mods);

        let score_data: IScore = score;
        if (score.beatmap) {
            score_data.beatmap!.attributes = attributes;
        }
        return score_data;
    } catch (err) {
        console.error(err);
        return null;
    }
}

async function getUserBeatmapScores(user_id: number | string, beatmap_id: number | string, ruleset: string): Promise<IScore[] | null> {
    try {
        // const response = await fetch(`${SCORE_INSPECTOR_API}extension/scores/${beatmap_id}/${user_id}/${ruleset}`, {
        //     method: "GET"
        // });
        const data = await APIGetBeatmapScores(beatmap_id, user_id, ruleset);
        return data; //will return IScore[] soon, NOT {scores: IScore[]}
    } catch (err) {
        console.error(err);
        return null;
    }
}