export interface IBeatmapDifficulty {

}

export class BeatmapDifficulty implements IBeatmapDifficulty {
    constructor(beatmap, mods, attributes) {
        this.star_rating = parseFloat(attributes.star_rating ?? 0);
        this.max_combo = parseFloat(attributes.max_combo ?? 0);

        //osu
        this.aim_difficulty = parseFloat(attributes.aim_difficulty ?? 0);
        this.speed_difficulty = parseFloat(attributes.speed_difficulty ?? 0);
        this.flashlight_difficulty = parseFloat(attributes.flashlight_difficulty ?? 0);
        this.speed_note_count = parseFloat(attributes.speed_note_count ?? 0);
        this.aim_difficult_slider_count = parseFloat(attributes.aim_difficult_slider_count ?? 0);
        this.slider_factor = parseFloat(attributes.slider_factor ?? 0);
        this.aim_difficult_strain_count = parseFloat(attributes.aim_difficult_strain_count ?? 0);
        this.speed_difficult_strain_count = parseFloat(attributes.speed_difficult_strain_count ?? 0);

        //taiko
        this.mono_stamina_factor = parseFloat(attributes.mono_stamina_factor ?? 0);

        this.applyMods(beatmap, mods);
    }

    applyMods(beatmap, mods) {
        if (!this.approach_rate) {
            let ar_multiplier = 1;
            let ar;

            if (Mods.hasMod(mods, "HR")) {
                ar_multiplier = 1.4;
            } else if (Mods.hasMod(mods, "EZ")) {
                ar_multiplier = 0.5;
            }

            let original_ar = beatmap.ar;
            if (Mods.hasMod(mods, "DA") && Mods.containsSetting(mods, "approach_rate")) {
                original_ar = Mods.getModSetting(mods, "DA", "approach_rate");
            }
            original_ar = Number(original_ar);

            ar = original_ar * ar_multiplier;

            if (Mods.hasMod(mods, "HR")) ar = Math.min(10, ar);

            this.approach_rate = ar;
        }

        if (!this.circle_size) {
            let cs = 1;
            let cs_multiplier = 1;

            if (Mods.hasMod(mods, "HR")) {
                cs_multiplier = 1.3;
            } else if (Mods.hasMod(mods, "EZ")) {
                cs_multiplier = 0.5;
            }

            let original_cs = beatmap.cs;
            if (Mods.hasMod(mods, "DA") && Mods.containsSetting(mods, "circle_size")) {
                original_cs = Mods.getModSetting(mods, "DA", "circle_size");
            }
            original_cs = Number(original_cs);

            cs = original_cs * cs_multiplier;

            if (cs > 10) cs = 10;

            this.circle_size = cs;
        }

        if (!this.overall_difficulty) {
            let od = 1;
            let od_multiplier = 1;

            if (Mods.hasMod(mods, "HR")) {
                od_multiplier = 1.4;
            } else if (Mods.hasMod(mods, "EZ")) {
                od_multiplier = 0.5;
            }

            let original_od = beatmap.accuracy;
            if (Mods.hasMod(mods, "DA") && Mods.containsSetting(mods, "overall_difficulty")) {
                original_od = Mods.getModSetting(mods, "DA", "overall_difficulty");
            }
            original_od = Number(original_od);

            od = original_od * od_multiplier;

            if (Mods.hasMod(mods, "HR")) od = Math.min(10, od);

            this.overall_difficulty = od;
        }

        if (!this.drain_rate) {
            let hp = 1;
            let hp_multiplier = 1;

            if (Mods.hasMod(mods, "HR")) {
                hp_multiplier = 1.4;
            } else if (Mods.hasMod(mods, "EZ")) {
                hp_multiplier = 0.5;
            }

            let original_hp = beatmap.drain;
            if (Mods.hasMod(mods, "DA") && Mods.containsSetting(mods, "drain_rate")) {
                original_hp = Mods.getModSetting(mods, "DA", "drain_rate");
            }
            original_hp = Number(original_hp);

            hp = original_hp * hp_multiplier;

            if (hp > 10) hp = 10;

            this.drain_rate = hp;
        }
    }
}