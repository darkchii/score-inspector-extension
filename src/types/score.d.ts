import type { IBeatmap } from "./beatmap";

export interface IScore {
    beatmap?: IBeatmap | undefined;
    user?: any;

    id: number;
    user_id: number;
    ruleset_id: number;
    pp: number;
    beatmap_id: number;
    ended_at: string | Date;
    rank: string;
    classic_total_score: number;
    accuracy: number;
    max_combo: number;
    mods: any;

    statistics: IScoreStatistics;
}

export interface IScoreStatistics {
    perfect: number;
    great: number;
    good: number;
    meh: number;
    miss: number;
    ok: number;
    large_tick_hit: number;
    small_tick_miss: number;
}