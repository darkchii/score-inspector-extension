import { getScoreRankHistory } from "./api";
import { formatNumberAsSize, MODE_SLUGS_ALT, WaitForElement } from "./helpers";
import { OFFICIAL_LEADERBOARD_STRUCTURES } from "./leaderboards";

const DISALLOWED_FILTERS = ["friends", "country", "variant"];
export async function runScoreRankChanges() {
    const _url = window.location.href;
    const mode = _url.match(/\/rankings\/(osu|taiko|fruits|mania)\/global\/score/)?.[1];
    if (!mode) {
        return;
    }

    const url = new URL(_url);
    const params = url.searchParams;
    for (const param of params.keys()) {
        let value = params.get(param);
        if (DISALLOWED_FILTERS.includes(param) && value !== "all") {
            return;
        }
    }

    const mode_id = MODE_SLUGS_ALT.indexOf(mode);
    if (mode_id === -1) {
        return;
    }

    await WaitForElement('.ranking-page-table');

    const table = document.getElementsByClassName('ranking-page-table')[0]!;
    const thead = table.getElementsByTagName('thead')[0]!;
    const tbody = table.getElementsByTagName('tbody')[0]!;
    const rows = tbody.getElementsByTagName('tr')!;
    const headerRow = thead.getElementsByTagName('tr')[0]!;

    const headerCells = headerRow.getElementsByTagName('th');

    let LEADERBOARD_STRUCTURE = OFFICIAL_LEADERBOARD_STRUCTURES.score();

    const RANK_INDEX = LEADERBOARD_STRUCTURE.indexOf("pos");
    const USER_INDEX = LEADERBOARD_STRUCTURE.indexOf("user");
    const RANK_CHANGE_INDEX = RANK_INDEX + 1;
    const SCORE_INDEX = LEADERBOARD_STRUCTURE.indexOf("ranked_score");
    const SCORE_CHANGE_OFFSET = 2;
    const SCORE_CHANGE_INDEX = SCORE_INDEX + 1 + SCORE_CHANGE_OFFSET;

    let rank_change_date = null;

    let ids: string[] = [];
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        const cells = row.getElementsByTagName('td')!;

        //get the user id from the data-user-id attribute
        //from column 1, get the the first child element with class 'js-usercard' in it, then get the data-user-id attribute
        const user_id = cells[USER_INDEX]!.getElementsByClassName('js-usercard')[0]!.getAttribute('data-user-id');
        if (user_id) {
            ids.push(user_id);
        }
    }

    const data = await getScoreRankHistory(ids, mode_id);

    if (!data || data.error) {
        console.error(data.error);
        return;
    }

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        const cells = row.getElementsByTagName('td')!;
        const user_id = cells[USER_INDEX]!.getElementsByClassName('js-usercard')[0]!.getAttribute('data-user-id');
        const current_rank_str = cells[RANK_INDEX]!.textContent; //"#1", "#2", etc
        const current_rank = parseInt(current_rank_str!.trim().slice(1)); //remove the "#" and parse to int

        //get title
        // const current_score_str = cells[SCORE_INDEX].children[0].getAttribute('title');
        const current_score_str = cells[SCORE_INDEX]!.textContent; //this is the human-readable
        const current_score = Number(current_score_str!.replace(/,/g, ''));

        if (i == 0) {
            console.log(`Current rank: ${current_rank}, Current score: ${current_score}`);
        }

        const rank_change_data = data.find((d: any) => d.user_id == user_id);
        let change_rank = 0;
        let change_score = 0;

        if (rank_change_data) {
            let old_rank = parseInt(rank_change_data.rank);
            let old_score = parseInt(rank_change_data.ranked_score);
            change_rank = old_rank - current_rank;
            change_score = current_score - old_score;

            if (!rank_change_date) {
                rank_change_date = new Date(rank_change_data.date);
            }
        }

        const rank_change_text = getRankChangeText(change_rank);
        row.insertBefore(rank_change_text, cells[RANK_CHANGE_INDEX]!);

        const rank_change_icon = getRankChangeIcon(change_rank);
        row.insertBefore(rank_change_icon, cells[RANK_CHANGE_INDEX]!);

        //human readable score change
        const score_change_text = getRankChangeText(change_score, true);
        row.insertBefore(score_change_text, cells[SCORE_CHANGE_INDEX]!);

        const score_change_icon = getRankChangeIcon(change_score);
        row.insertBefore(score_change_icon, cells[SCORE_CHANGE_INDEX]!);
    }

    //insert empty header cells for rank change at RANK_CHANGE_INDEX
    headerRow.insertBefore(document.createElement('th'), headerCells[RANK_CHANGE_INDEX]!);
    headerRow.insertBefore(document.createElement('th'), headerCells[RANK_CHANGE_INDEX]!);

    //insert empty header cells for score change at SCORE_CHANGE_INDEX
    headerRow.insertBefore(document.createElement('th'), headerCells[SCORE_CHANGE_INDEX]!);
    headerRow.insertBefore(document.createElement('th'), headerCells[SCORE_CHANGE_INDEX]!);

    if (rank_change_date) {
        //get the 2nd pagination
        const pagination = document.getElementsByClassName("pagination-v2")[1];

        //below this, add a text that tells us from what date the score difference is from
        const dateText = document.createElement("div");
        dateText.classList.add("ranking-page-table__date");
        dateText.textContent = `Rank changes are from ${rank_change_date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        })}`;
        (pagination as HTMLElement).parentNode!.insertBefore(dateText, pagination!);
    }
}

const getRankChangeIcon = (change: number): HTMLTableCellElement => {
    const td = document.createElement('td');

    //ranking-page-table__column ranking-page-table__column--rank-change-icon ranking-page-table__column--rank-change-none
    //ranking-page-table__column ranking-page-table__column--rank-change ranking-page-table__column--rank-change-up
    td.classList.add('ranking-page-table__column', 'ranking-page-table__column--rank-change');
    if (change === 0) {
        td.classList.add('ranking-page-table__column--rank-change-none');
    } else if (change > 0) {
        td.classList.add('ranking-page-table__column--rank-change-up');
    } else {
        td.classList.add('ranking-page-table__column--rank-change-down');
    }

    return td;
}

const getRankChangeText = (change: number, format: boolean = false): HTMLTableCellElement => {
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
            td.textContent = `${Math.abs(change)}`;
        }
    }

    return td;
}