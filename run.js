//osu! scores inspector browser extension
//extends osu!alt and inspector data to the official osu! website

const SCORE_INSPECTOR_API = "https://api.kirino.sh/inspector/";

async function run() {
    //check if we are on userpage

    //wait for a split second for the page to load
    await new Promise(r => setTimeout(r, 500));

    if (window.location.href.includes("osu.ppy.sh/users")) {
        //wait for "profile-info__name" to load, if it takes longer than 5 seconds, give up
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
            run();
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

    if (data.user_data?.inspector_user?.clan_member) {
        setOrCreateUserClanTagElement(data.user_data.inspector_user.clan_member.clan);
        setOrCreateUserClanBannerElement(data.user_data.inspector_user.clan_member.clan);
    }

    if (mode === "osu") {
        if (data.stats_data) {
            setOrCreateStatisticsElements(data.stats_data);
        }
    }
}

async function getUserData(user_id) {
    //first we get /users/full/{user_id}
    const url = SCORE_INSPECTOR_API + "users/full/" + user_id + "?skipDailyData=true&skipOsuData=true";
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
        console.error(data.error);
        return;
    }

    //then we get /users/stats/{user_id}
    const response2 = await fetch(SCORE_INSPECTOR_API + "users/stats/" + user_id);
    const data2 = await response2.json();

    if (data2.error) {
        console.error(data2.error);
        return;
    }

    const username = data?.alt?.username ?? data?.inspector_user?.known_username;

    //get top50s data (https://osustats.ppy.sh/api/getScores)
    const request_body = {
        accMax: 100,
        gamemode: 0,
        page: 1,
        rankMax: 50,
        rankMin: 1,
        resultType: 1,
        sortBy: 0,
        sortOrder: 0,
        u1: username
    }
    const response3 = await fetch(`https://osustats.ppy.sh/api/getScores`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request_body)
    });
    const data3 = await response3.json();

    const _stats = {
        ...data2.stats,
        top50s: data3
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

    var top50sDisplay = getValueDisplay("Top 50s", Number(data.top50s[1] ?? 0).toLocaleString());
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
