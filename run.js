//osu! scores inspector browser extension
//extends osu!alt and inspector data to the official osu! website

const SCORE_INSPECTOR_API = "http://localhost:3863/";

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
    var profileNameParentNode = document.getElementsByClassName("profile-info__name")[0];
    const url = window.location.href;
    //remove trailing slash if it exists
    let fixedUrl = url.endsWith("/") ? url.slice(0, -1) : url;

    // const user_id = url.substring(url.lastIndexOf("/users/") + 7);
    const user_id = url.match(/\/users\/(\d+)/)[1];

    //after user_id, there may be a /osu, /taiko, /fruits or /mania, check for it. If none, it's osu
    let mode = url.match(/\/users\/\d+\/(osu|taiko|fruits|mania)/);
    mode = mode ? mode[1] : "osu";

    const data = await getUserData(user_id);

    if (data.user_data?.inspector_user?.clan_member) {
        setOrCreateUserClanTagElement(data.user_data.inspector_user.clan_member.clan);
    }

    if (mode === "osu") {
        if (data.stats_data) {
            setOrCreateStatisticsElements(data.stats_data);
        }
    }
}

async function getUserData(user_id) {
    //first we get /users/full/{user_id}
    const response = await fetch(SCORE_INSPECTOR_API + "users/full/" + user_id + "?skipDailyData=true&skipOsuData=true");
    const data = await parseReadableStreamToJson(response.body);

    if (data.error) {
        console.error(data.error);
        return;
    }

    //then we get /users/stats/{user_id}
    const response2 = await fetch(SCORE_INSPECTOR_API + "users/stats/" + user_id);
    const data2 = await parseReadableStreamToJson(response2.body);

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
        console.log("count", rank, count);
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
    userTagParent.href = `https://score.kirino.sh/clans/${clan.id}`;
    userTagParent.target = "_blank";
}

async function parseReadableStreamToJson(input) {
    const data = (await input.getReader().read()).value
    const str = String.fromCharCode.apply(String, data);
    return JSON.parse(str);
}
