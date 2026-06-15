import { getBeatmapMedia } from "./api";
import { addStyle, getValue } from "./gm_api";
import type { IBeatmapMedia } from "./types/beatmapMedia";

export async function runBeatmapPage() {
    if (!window.location.href.includes("/beatmapsets/")) {
        return;
    }

    try {
        const url = window.location.href;
        //parse https://osu.ppy.sh/beatmapsets/1436961#osu/2956597, get the first ID
        let fixedUrl = url.endsWith("/") ? url.slice(0, -1) : url;
        let beatmapset_id: string | null = null;
        try {
            beatmapset_id = (fixedUrl.match(/\/beatmapsets\/(\d+)/)?.[1] as string) || null;
            if (beatmapset_id) {
                //check if it is a valid number
                const beatmapset_id_number: number = Number(beatmapset_id);
                if (isNaN(beatmapset_id_number)) {
                    beatmapset_id = null;
                }
            }
        } catch (e) { }
        if (!beatmapset_id) {
            return;
        }

        const beatmapset_id_number: number = Number(beatmapset_id);

        if (getValue('beatmap_page_show_media', true)) {
            const media: IBeatmapMedia | null = await getBeatmapMedia(beatmapset_id_number);
            if (media) {
                populateBeatmapMedia(media);
            }
        }
    } catch (err) {
        console.error("Error finding beatmapset id", err);
    }
}

function populateBeatmapMedia(media: IBeatmapMedia) {
    //find the div with class 'beatmap-success-rate', get the parent and remove the one we searched
    //the parent will be the container we want to use
    const beatmapSuccessRateContainer = document.querySelector(".beatmap-success-rate");
    if (!beatmapSuccessRateContainer) {
        return;
    }
    const container = beatmapSuccessRateContainer.parentElement;
    if (!container) {
        return;
    }
    beatmapSuccessRateContainer.remove();

    //there can be several media types; youtube, spotify
    //each should show under each other, and expand to the height of the container

    createStyles();

    const beatmapMedia = document.createElement("div");
    beatmapMedia.className = "beatmap-media";

    if (media.youtube_id) {
        beatmapMedia.appendChild(buildYoutubeMediaElement(media));
    }
    if (media.spotify_id) {
        beatmapMedia.appendChild(buildSpotifyMediaElement(media));
    }

    container.appendChild(beatmapMedia);
}

function createStyles() {
    //handle it as a grid so we can add gap between elements. Its a simple vertical list
    addStyle(`
        .beatmap-media {
            display: grid;
            grid-template-columns: 1fr;
            grid-template-rows: auto auto;
            grid-auto-flow: row;
            gap: 5px;
        }

        .beatmap-media-element {
            position: relative;
            width: 100%;
            overflow: hidden;
        }

        .beatmap-media-element iframe {
            border: none;
            border-radius: 15px;
            overflow: hidden;
            width: 100%;
        }
        `);
}

function buildYoutubeMediaElement(media: IBeatmapMedia) {
    const element = document.createElement("div");
    element.className = "beatmap-media-element";
    element.innerHTML = `
        <iframe 
            src="https://www.youtube.com/embed/${media.youtube_id}" 
            title="YouTube video player" 
            frameborder="0" 
            height="150"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            referrerpolicy="strict-origin-when-cross-origin" 
            allowfullscreen>
        </iframe>
    `;
    return element;
}

function buildSpotifyMediaElement(media: IBeatmapMedia) {
    const element = document.createElement("div");
    element.className = "beatmap-media-element";
    element.innerHTML = `
        <iframe 
            src="https://open.spotify.com/embed/${media.spotify_id}" 
            title="Spotify player" 
            height="76"
            frameborder="0" 
            scrolling="no"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            referrerpolicy="strict-origin-when-cross-origin" 
            allowfullscreen>
        </iframe>
    `;
    return element;
}