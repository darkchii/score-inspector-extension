export const OFFICIAL_LEADERBOARD_STRUCTURES = { //the filter functions exist for future conditional columns
    'performance': () => {
        return [
            "pos",
            'change',
            "user",
            "accuracy", //or "completion", but same position
            "play_count",
            "ranked_score",
            "performance",
            "ss",
            "s",
            "a",
        ].filter(n => n);
    },
    'score': () => {
        //its dynamic based on some settings so its a function
        return [
            "pos",
            "user",
            "accuracy", //or "completion", but same position
            "play_count",
            "ranked_score",
            "performance",
            "ss",
            "s",
            "a",
        ].filter(n => n);
    },
    'rooms': () => {
        return [
            "pos",
            "user",
            "accuracy",
            "play_count",
            "total_score"
        ].filter(n => n);
    },
    'daily-challenge': () => {
        return [
            "pos",
            "user",
            "accuracy",
            "play_count",
            "total_score"
        ].filter(n => n);
    },
    'seasons': () => {
        return [
            "pos",
            "user",
            "total_score",
            "division",
        ].filter(n => n);
    },
    'charts': () => {
        return [
            "pos",
            "user",
            "accuracy",
            "play_count",
            "total_score",
            "ranked_score",
            "ss",
            "s",
            "a",
        ].filter(n => n);
    },
    'kudosu': () => {
        return [
            "pos",
            "user",
            "earned",
            "available",
            "spent",
        ].filter(n => n);
    },
    'ranked-play': () => {
        return [
            "pos",
            "user",
            "wins",
            "plays",
            "rating"
        ].filter(n => n);
    },
    'top-plays': () => {
        return [
            "pos",
            "user",
            "map",
            "max_combo",
            "accuracy",
            "miss",
            "pp",
            "time",
            "mods",
            "dropdown"
        ].filter(n => n);
    }
}