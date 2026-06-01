import { getValue, setValue } from "./gm_api";
import { GetTeamColor, MODE_SLUGS_ALT } from "./helpers";
import type { IBeatmapAttributes } from "./types/attributes";
import type { IBeatmap } from "./types/beatmap";
import type { IScore } from "./types/score";
import type { IScoreRank } from "./types/scorerank";
import type { IAltUserData, IUser } from "./types/user";
import config from "./config.json";
import type { ITeam } from "./types/team";

//all api stuff
const DEFAULT_API_VERSION = 20240529;

async function APIClientLogin() {
    const client_id = getValue<string>("api_client_id", "");
    const client_secret = getValue<string>("api_client_secret", "");

    if (!client_id || !client_secret) {
        throw new Error('API client ID and secret must be set');
    }

    const data = {
        client_id: client_id,
        client_secret: client_secret,
        grant_type: 'client_credentials',
        scope: 'public'
    };

    try {
        const response = await fetch('https://osu.ppy.sh/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "Accept-Encoding": "gzip,deflate,compress"
            },
            body: JSON.stringify(data)
        });
        const responseData = await response.json();

        if (response.status === 200 && responseData) {
            const expiresIn = responseData.expires_in || 3600; // Default to 1 hour if not provided
            setValue("api_access_token", responseData.access_token);
            setValue("api_token_expiration", Date.now() + expiresIn * 1000);
            return responseData.access_token;
        } else {
            throw new Error('Failed to retrieve access token');
        }
    } catch (error) {
        console.error('Error during client login:', error);
        throw new Error('Failed to login to osu! API');
    }
}

async function APIAuthorizedApiCall(url: string, headers: HeadersInit, timeout = 10000, post_body: any = null, response_type: 'json' | 'blob' | 'arraybuffer' | null = null) {
    try {
        const fetchOptions: RequestInit = {
            method: post_body ? 'POST' : 'GET',
            headers: headers,
            body: post_body ? JSON.stringify(post_body) : null,
        };

        const response = await fetch(url, fetchOptions);
        let data;
        if (response_type === 'blob') {
            data = await response.blob();
        } else if (response_type === 'arraybuffer') {
            data = await response.arrayBuffer();
        } else {
            data = await response.json();
        }

        if (response.status === 200) {
            return data;
        } else {
            //if the route is /api/v2/users/ and 404s, it means the user doesn't exist, rather than the path being wrong, so return null instead of throwing an error
            if (url.includes('/api/v2/users/') && response.status === 404) {
                return null;
            }
            throw new Error(`API call failed with status code ${response.status}`);
        }
    } catch (error: any) {
        //same user 404 handling as above
        if (error.response && error.response.status === 404 && url.includes('/api/v2/users/')) {
            return null;
        }
        console.error('Error during authorized API call:', error);
        throw new Error('Failed to make authorized API call');
    }
}

async function APIAuthorizedClientApiCall(url: string, type: 'get' | 'post' = 'get', api_version: number | null = null, timeout = 10000, post_body: any = null, content_type = 'application/json', response_type: 'json' | 'blob' | 'arraybuffer' | null = null) {
    let access_token = getValue<string | null>("api_access_token", null);
    if (!access_token || Date.now() >= getValue<number>("api_token_expiration", 0)) {
        access_token = await APIClientLogin();
    }

    const headers: HeadersInit = {
        'Content-Type': content_type,
        'Accept': 'application/json',
        'Authorization': `Bearer ${access_token}`,
        'Accept-Encoding': 'gzip, deflate, compress',
        'x-api-version': `${api_version || DEFAULT_API_VERSION}`
    }

    const res = await APIAuthorizedApiCall(url, headers, timeout, post_body, response_type);
    return res;
}

export async function APIGetUserData(userId: string | number): Promise<IUser | null> {
    try {
        const url = `https://osu.ppy.sh/api/v2/users/${userId}`;
        const response = await APIAuthorizedClientApiCall(url, 'get');
        if (response && response.id) {
            return response;
        }
        throw new Error('Invalid response from osu! API');
    } catch (error) {
        console.error('Error during getting user data:', error);
        throw new Error('Failed to get user data from osu! API');
    }
}

export async function APIGetUsers(userIds: string[]): Promise<IUser[]> {
    try {
        //max 50 per request, so split into chunks
        //no parallel requests due to rate limits
        let allUsers: IUser[] = [];
        for (let i = 0; i < userIds.length; i += 50) {
            const chunk = userIds.slice(i, i + 50);
            const url = `https://osu.ppy.sh/api/v2/users?ids[]=${chunk.join('&ids[]=')}`;
            const response = await APIAuthorizedClientApiCall(url, 'get');
            if (response && Array.isArray(response?.users)) {
                allUsers = allUsers.concat(response?.users || []);
            }
        }
        return allUsers;
    } catch (error) {
        console.error('Error during getting users data:', error);
        throw new Error('Failed to get users data from osu! API');
    }
}

export async function APIGetBeatmapScores(beatmapId: string | number, userId: string | number, rulesetId: string): Promise<IScore[] | null> {
    try {
        const beatmap = await APIGetBeatmap(beatmapId);
        const res = await APIAuthorizedClientApiCall(`https://osu.ppy.sh/api/v2/beatmaps/${beatmapId}/scores/users/${userId}/all?ruleset=${rulesetId}`, 'get', null);

        //attach beatmap to each score
        if (res && res.scores) {
            res.scores = res.scores.map((score: IScore) => {
                score.beatmap = beatmap!;
                return score;
            });
        }

        //get attributes for each score and attach to the inner beatmap
        if (res && res.scores) {
            for (const score of res.scores) {
                const attributes = await APIGetBeatmapAttributes(beatmapId, rulesetId, score.mods);
                score.beatmap!.attributes = attributes || undefined;
            }
        }

        return res?.scores;
    } catch (err: any) {
        throw new Error('Unable to get user beatmap scores: ' + err.message);
    }
}

async function APIGetBeatmap(beatmapId: string | number, mods: string[] | null = null): Promise<IBeatmap | null> {
    try {
        const res = await APIAuthorizedClientApiCall(`https://osu.ppy.sh/api/v2/beatmaps/${beatmapId}`, 'get', null);
        return res;
    } catch (err: any) {
        throw new Error('Unable to get beatmap data: ' + err.message);
    }
}

export async function APIGetBeatmapAttributes(beatmapId: string | number, rulesetId: string, mods: string[] | null = null): Promise<IBeatmapAttributes | null> {
    try {
        const body = {
            mods: mods || [],
            ruleset_id: rulesetId
        }
        const res = await APIAuthorizedClientApiCall(`https://osu.ppy.sh/api/v2/beatmaps/${beatmapId}/attributes`, 'post', null, undefined, body);
        return res?.attributes || null;
    } catch (err: any) {
        throw new Error('Unable to get beatmap attributes: ' + err.message);
    }
}

async function APIGetScoreRank(userId: string | number, rulesetId: string): Promise<IScoreRank | null> {
    try {
        const url = `https://score.respektive.pw/u/${userId}?m=${rulesetId}`;
        //use fetch
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate, compress'
            }
        });
        if (response.status === 200) {
            const data = await response.json();
            return data;
        }
        else {
            throw new Error(`Score rank API call failed with status code ${response.status}`);
        }
    } catch (error) {
        console.error('Error during getting score rank:', error);
        throw new Error('Failed to get score rank from API');
    }
}

const USER_TEAM_CACHE: { [user_id: string]: ITeam } = {};
const SKIP_USER_TEAM_FETCH: string[] = []; //these don't have teams, so we skip them for this session
export async function getTeams(user_id_array: string[] | null): Promise<{ [user_id: string]: ITeam } | null> {
    if (!user_id_array || user_id_array.length === 0) {
        return null;
    }

    //remove users that are in the SKIP_USER_TEAM_FETCH array
    user_id_array = user_id_array.filter(user_id => !SKIP_USER_TEAM_FETCH.includes(user_id));

    let team_map: { [user_id: string]: ITeam } = {};

    //check if we have the data in cache
    user_id_array.forEach(user_id => {
        if (USER_TEAM_CACHE[user_id]) {
            team_map[user_id] = USER_TEAM_CACHE[user_id];
        }
    });

    //filter out the user_ids that are already in the cache
    user_id_array = user_id_array.filter(user_id => !USER_TEAM_CACHE[user_id]);

    if (user_id_array.length === 0) {
        return team_map;
    }

    const userData = await APIGetUsers(user_id_array);

    if (!userData || userData.length === 0) {
        return team_map;
    }

    for (const user of userData) {
        if (user.team) {
            team_map[`${user.id}`] = user.team;
            USER_TEAM_CACHE[`${user.id}`] = user.team;

            //temporary
            team_map[`${user.id}`]!.color = GetTeamColor(user.team);
            USER_TEAM_CACHE[`${user.id}`]!.color = GetTeamColor(user.team);
        }
    }

    const no_team_users = user_id_array.filter(user_id => !userData.find(user => `${user.id}` === user_id && user.team));
    if (no_team_users.length > 0) {
        no_team_users.forEach(user_id => {
            SKIP_USER_TEAM_FETCH.push(user_id);
        });
    }

    return team_map;
}

export async function getUserData(user_id: string, mode: string = "osu") {
    const modeIndex = MODE_SLUGS_ALT.indexOf(mode);
    let user_data: IAltUserData | null = null;
    try {
        // Inspector/alt data
        const alt_user_data = await fetch(`${config.API_URL}extension/profile`, {
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({
                user_id: user_id,
                mode: modeIndex,
            })
        });
        user_data = (await alt_user_data.json() as IAltUserData) || null;

        const osu_team = await getTeams([user_id]);

        if (osu_team) {
            user_data!.team = osu_team[user_id]!;
        }

        return user_data;
    } catch (err) {
        console.error(err);
        return null;
    }
}

// export async function getUserBeatmapScores(user_id: string, beatmap_id: string, ruleset: string) {
//     try {
//         // const response = await fetch(`${SCORE_INSPECTOR_API}extension/scores/${beatmap_id}/${user_id}/${ruleset}`, {
//         //     method: "GET"
//         // });
//         const data: IScore[] | null = await APIGetBeatmapScores(beatmap_id, user_id, ruleset);

//         console.log(data);
//         if (data) {
//             let attr_cache: { [key: string]: IBeatmapAttributes } = {};
//             let _data = data.map(async (score) => {
//                 //get the attributes for the score remotely
//                 // let attributes = await getBeatmapAttributes(score.beatmap_id, score.ruleset_id, score.mods);
//                 let attributes = null;
//                 let mod_str = JSON.stringify(score.mods.data);
//                 let mod_str_hash = btoa(mod_str);
//                 if (attr_cache[mod_str_hash]) {
//                     attributes = attr_cache[mod_str_hash];
//                 } else {
//                     attributes = await APIGetBeatmapAttributes(score.beatmap_id, score.ruleset_id, score.mods);
//                     attr_cache[mod_str_hash] = attributes;
//                 }
//                 return new Score(score, attributes, data.beatmap);
//             });
//             return {
//                 scores: await Promise.all(_data),
//                 beatmap: data.beatmap,
//                 attributes: data.attributes
//             };
//         } else {
//             console.error("Error fetching beatmap scores", response.status, response.statusText);
//             return null;
//         }
//     } catch (err) {
//         console.error(err);
//     }
// }