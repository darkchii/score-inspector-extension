import type { ITeam } from "./team";

export interface IUser {
    id: number;
    username: string;
    country_code: string;
    avatar_url: string;
    team?: ITeam | null;
}

export interface IAltUser {
    user_id: number;
    username: string;
    country_code: string;
    country_name: string;

    osu_grade_counts_d: number;
    osu_grade_counts_c: number;
    osu_grade_counts_b: number;
    osu_grade_counts_a: number;
    osu_grade_counts_s: number;
    osu_grade_counts_sh: number;
    osu_grade_counts_ss: number;
    osu_grade_counts_ssh: number;

    taiko_grade_counts_d: number;
    taiko_grade_counts_c: number;
    taiko_grade_counts_b: number;
    taiko_grade_counts_a: number;
    taiko_grade_counts_s: number;
    taiko_grade_counts_sh: number;
    taiko_grade_counts_ss: number;
    taiko_grade_counts_ssh: number;

    fruits_grade_counts_d: number;
    fruits_grade_counts_c: number;
    fruits_grade_counts_b: number;
    fruits_grade_counts_a: number;
    fruits_grade_counts_s: number;
    fruits_grade_counts_sh: number;
    fruits_grade_counts_ss: number;
    fruits_grade_counts_ssh: number;

    mania_grade_counts_d: number;
    mania_grade_counts_c: number;
    mania_grade_counts_b: number;
    mania_grade_counts_a: number;
    mania_grade_counts_s: number;
    mania_grade_counts_sh: number;
    mania_grade_counts_ss: number;
    mania_grade_counts_ssh: number;

    completion: number | null;
}

export interface IAltUserData {
    user: IAltUser | null;
    team: ITeam | null;
    scoreRankHistory: IScoreRankHistoryEntry[] | null;
    ruleset: number;
    completion: ICompletionistData[] | null;
    stats: IAltUserStats | null;
}

export interface ICompletionistData {
    user_id: number;
    mode: number;
    completion_date: Date;
    scores: number;
}

export interface IScoreRankHistoryEntry {

}

export interface IAltUserStats {
    scoreRank: number;
}