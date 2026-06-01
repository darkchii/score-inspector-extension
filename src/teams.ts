import { getTeams } from "./api";
import type { ITeam } from "./types/team";

const TAG_TIMEOUT = 5000;
let update_tag_observer: MutationObserver | null = null;
let update_tag_observer_list = [
    "beatmapset-scoreboard__main",
    "beatmap-scoreboard-table",
    "beatmap-scoreboard-table__body",
    "beatmap-scoreboard-table__table",
    "osu-layout__col-container",
    "user-list__items",
    "beatmapsets",
    "osuplus-table",
    "qtip--user-card"
];

export async function runTeams() {
    if (!update_tag_observer) {
        update_tag_observer = new MutationObserver((mutationsList, observer) => {
            for (let mutation of mutationsList) {
                let target: Element = mutation.target as Element;
                let shouldRun = false;
                for (const className of update_tag_observer_list) {
                    if (target.classList.contains(className)) {
                        shouldRun = true;
                        break;
                    }
                }
                if (shouldRun) {
                    Promise.race([updateUserTags(), new Promise(r => setTimeout(r, TAG_TIMEOUT))]);
                }
            }
        });
        update_tag_observer.observe(document.body, { childList: true, subtree: true });
    }
    await updateUserTags();
}

let is_tags_working: boolean = false;
async function updateUserTags() {
    if (is_tags_working) {
        let attempts = 0;
        while (is_tags_working && attempts < 5) {
            await new Promise(r => setTimeout(r, 1000));
            attempts++;
        }

        if (attempts >= 5) {
            console.warn("User tags are taking too long to update, skipping...");
            return;
        }
    }
    is_tags_working = true;

    await new Promise(r => setTimeout(r, 250));
    try {
        const usercards = document.getElementsByClassName("js-usercard");
        const usercards_big = document.getElementsByClassName("user-card");
        //remove found elements that already have a (nested) child with class "inspector_user_tag"
        const usercards_filtered = Array.from(usercards).filter(card => !card.querySelector(".inspector_user_tag"));
        const usercards_big_filtered = Array.from(usercards_big).filter(card => !card.querySelector(".inspector_user_tag"));

        const user_ids = Array.from(usercards_filtered).map(card => card.getAttribute("data-user-id"));
        const user_ids_big = Array.from(usercards_big_filtered).map(card => getUserCardBigID(card));
        const _user_ids = user_ids.concat(user_ids_big).filter((v, i, a) => a.indexOf(v) === i);

        if (!_user_ids || _user_ids.length === 0) {
            is_tags_working = false;
            return;
        }

        const teams = await getTeams(_user_ids as string[]);

        if (teams && Object.keys(teams).length > 0) {
            modifyJsUserCards(teams);
        }
    } catch (err) {
        console.error(err);
    }
    is_tags_working = false;
}

function getUserCardBigID(card: Element): string | null {
    const container = card.querySelector("a");
    if (!container) return null;
    const href_split = container.href.split("/");
    if (href_split.length < 2) return null;
    const user_id: string | undefined = href_split[href_split.length - 1];

    if (!user_id) {
        console.error("Could not find user id in user card big", card);
        return null;
    }

    if (!parseInt(user_id)) {
        console.error("Invalid user id", user_id);
        return null;
    }
    return user_id;
}

function modifyJsUserCards(teams: { [user_id: string]: ITeam }) {
    if (!teams || Object.keys(teams).length === 0) return;

    let usercards: Element[] = Array.from(document.querySelectorAll("[class*='js-usercard'], [class*='user-card--card']"));
    usercards = Array.from(usercards).filter(card => !card.classList.contains("comment__avatar"));
    usercards = usercards.filter(card => !card.querySelector(".avatar.avatar--guest.avatar--beatmapset"));
    usercards = usercards.filter(card => !card.parentElement!.classList.contains("chat-conversation__new-chat-avatar"));
    usercards = usercards.filter(card => !card.parentElement!.classList.contains("chat-message-group__sender"));
    usercards = usercards.filter(card => !card.parentElement!.classList.contains("beatmap-discussion-user-card__avatar"));

    if(usercards.length === 0) return;

    for (let i = 0; i < usercards.length; i++) {
        if(!usercards[i]) continue;

        let user_id: string | null = null;
        let team: ITeam | null = null;

        if (usercards[i]!.classList.contains("user-card--card")) {
            user_id = getUserCardBigID(usercards[i]!);
            if (!user_id) continue;
            if(!teams[user_id]) continue;

            team = teams[user_id]!;
            if (!team) continue;

            setBigUserCardTeamTag(usercards[i]!, team);
            continue;
        }

        user_id = usercards[i]!.getAttribute("data-user-id");
        if (!user_id) continue;
        if(!teams[user_id]) continue;
        team = teams[user_id]!;

        if (!team) continue;

        setUserCardBrickTeamTag(usercards[i]!, team);
    }
}

function setBigUserCardTeamTag(card: Element, team: ITeam) {
    const usernameElement = card.getElementsByClassName("user-card__username u-ellipsis-pre-overflow")[0];
    if(!usernameElement || usernameElement.childNodes.length === 0) return;

    if (usernameElement.getElementsByClassName("inspector_user_tag").length > 0) {
        return;
    }
    const teamTag = generateTagSpan(team);
    usernameElement.insertBefore(teamTag, usernameElement.childNodes[0]!);
}

function setUserCardBrickTeamTag(card: Element, team: ITeam) {
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
        usercardLink.insertBefore(teamTag, usercardLink.childNodes[1]!);
    } else if (card.classList.contains("ranking-page-table-main__link")) {
        let nameSpan = card.getElementsByClassName("ranking-page-table-main__link-text")[0];
        if (!nameSpan) {
            nameSpan = document.createElement("span");
            nameSpan.classList.add("ranking-page-table-main__link-text");
            nameSpan.textContent = username;
            card.innerHTML = "";
            card.appendChild(nameSpan);
        }
        if (nameSpan.getElementsByClassName("inspector_user_tag").length > 0) {
            return;
        }
        nameSpan.insertBefore(teamTag, nameSpan.childNodes[0]!);
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
        // const userIcon = card.getElementsByClassName("forum-user-icon")[0];
        if (card.getElementsByClassName("forum-user-icon").length > 0) {
            index = 1;
        }

        card.insertBefore(teamTag, card.childNodes[index]!);
    }
}

const generateTagSpan = (team: ITeam) => {
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