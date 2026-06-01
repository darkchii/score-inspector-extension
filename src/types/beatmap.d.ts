import type { IBeatmapAttributes } from "./attributes";

export interface IBeatmap {
    attributes?: IBeatmapAttributes | null | undefined;

    id: number;
    max_combo: number;
}