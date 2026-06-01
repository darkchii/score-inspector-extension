export interface IBeatmapAttributes {
    star_rating: number;
    max_combo: number;

    //osu
    aim_difficulty: number;
    speed_difficulty: number;
    flashlight_difficulty: number;
    speed_note_count: number;
    aim_difficult_slider_count: number;
    slider_factor: number;
    aim_difficult_strain_count: number;
    speed_difficult_strain_count: number;

    //taiko
    mono_stamina_factor: number;

    [key: string]: any;
}