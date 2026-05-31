import type { IBeatmap } from "./beatmap";

export interface IScore {
    beatmap?: IBeatmap;

    id: number;
}