// ==UserScript==
// @name         osu! scores inspector
// @namespace    https://score.kirino.sh
// @version      2025-11-28.68
// @description  Display osu!alt and scores inspector data on osu! website
// @author       Amayakase
// @match        https://osu.ppy.sh/*
// @icon         https://raw.githubusercontent.com/darkchii/score-inspector-extension/main/icon48.png
// @noframes
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        window.onurlchange
// @require      https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js
// @require      https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0
// @downloadURL  https://github.com/darkchii/score-inspector-extension/raw/main/inspector.user.js
// @updateURL    https://github.com/darkchii/score-inspector-extension/raw/main/inspector.user.js
// ==/UserScript==

(function () {
    'use strict';

    const SCORE_INSPECTOR_API = "http://localhost:3863/";
    // const SCORE_INSPECTOR_API = "https://api.kirino.sh/inspector/";

    const IMAGE_DEFAULT_TEAM_BG = "https://cloud.kirino.sh/index.php/apps/raw/s/xn6ybB2ggC2KLcS";
    const IMAGE_ICON_SPINNER = "https://cloud.kirino.sh/index.php/apps/raw/s/4KmxzMtbEriHDXq";
    const IMAGE_SETTINGS = "https://raw.githubusercontent.com/darkchii/score-inspector-extension/main/icon48.png";

    //this data is used to generate both the settings container and the stored data
    let SETTINGS_DATA = [
        {
            'title': 'Info',
            'description': 'Reload the page to see the changes take effect.',
        },
        {
            'title': 'API',
            'description': 'Please set your OAuth token (https://osu.ppy.sh/home/account/edit)',
            'options': [
                {
                    'name': 'Client ID',
                    'internal_name': 'api_client_id',
                    'type': 'text',
                    'default': '',
                    'description': 'Enter your API client ID',
                },
                {
                    'name': 'Client Secret',
                    'internal_name': 'api_client_secret',
                    'type': 'text',
                    'default': '',
                    'description': 'Enter your API client secret',
                    'is_password': true,
                },
                {
                    'name': 'Test',
                    'internal_name': 'api_test',
                    'type': 'button',
                    'description': 'Test your API credentials',
                    'onClick': async () => {
                        //TODO
                        // console.log("Testing API credentials...");

                        try {
                            const userData = await APIGetUserData(2);
                            if (userData) {
                                alert("API credentials are valid! User data for user ID 2: " + userData.username);
                            } else {
                                alert("API credentials are invalid!");
                            }
                        } catch (error) {
                            alert("API credentials are invalid! Error: " + error.message);
                        }
                    }
                }
            ]
        },
        {
            'title': 'Profile',
            'internal_name': 'profile',
            'options': [
                {
                    'name': 'Show extra grades',
                    'internal_name': 'profile_show_extra_grades',
                    'type': 'checkbox',
                    'default': true,
                    'description': 'Show extra grades (B, C, D)',
                },
            ]
        },
        {
            'title': 'Teams',
            'internal_name': 'teams',
            'options': [
                {
                    'name': 'Show team tags',
                    'internal_name': 'teams_show_team_tags',
                    'type': 'checkbox',
                    'default': true,
                    'description': 'Show team tags',
                },
            ]
        },
        {
            'title': 'Beatmap Page',
            'internal_name': 'beatmap_page',
            'options': [
                {
                    'name': 'Show spinner count',
                    'internal_name': 'beatmap_page_show_spinner_count',
                    'type': 'checkbox',
                    'default': true,
                    'description': 'Show spinner count',
                },
                // {
                //     'name': 'Show performance calculator',
                //     'internal_name': 'beatmap_page_show_performance_calculator',
                //     'type': 'checkbox',
                //     'default': true,
                //     'description': 'Show performance calculator',
                // },
            ]
        },
        {
            'title': 'Score Page',
            'internal_name': 'score_page',
            'description': 'This is the page where you view an individual score',
            'options': [
                {
                    'name': 'Show user scores',
                    'internal_name': 'score_page_show_user_scores',
                    'type': 'checkbox',
                    'default': true,
                    'description': 'Show user scores',
                },
            ]
        }
    ]

    const MODE_NAMES = ["osu!", "osu!taiko", "osu!catch", "osu!mania"];
    const MODE_SLUGS = ["osu", "taiko", "catch", "mania"];
    const MODE_SLUGS_ALT = ["osu", "taiko", "fruits", "mania"];
    const GRAPHS = ["Performance", "Score"];

    // let CURRENT_GRAPH = 'Performance';
    let CURRENT_GRAPH = GM_getValue("inspector_current_graph", "Performance");

    //lets script know what elements to wait for before running
    const PAGE_ELEMENT_WAIT_LIST = {
        'user_page': '.profile-info__name',
    }

    const shortNum = (number) => {
        const postfixes = ['', 'k', 'M', 'B', 't']
        let count = 0
        while (number >= 1000 && count < postfixes.length) {
            number /= 1000
            count++
        }
        //round number to 2 decimal places
        number = Math.round(number * 100) / 100;
        return number + postfixes[count];
    }

    class Mods {
        constructor(obj) {
            this.data = obj || [];
            this.speed = 1;

            Mods.updateSpeed(this);

        }

        static updateSpeed(mods) {
            if (!mods) return;
            mods.speed = 1;
            if (Mods.hasMod(mods, "DT") || Mods.hasMod(mods, "NC")) {
                const mod = Mods.getMod(mods, "DT") || Mods.getMod(mods, "NC");
                mods.speed = mod?.settings?.speed_change || 1.5;
                if (mod?.settings && !mod.settings.speed_change) {
                    mods.speed = 1.5;
                }
            }

            if (Mods.hasMod(mods, "HT") || Mods.hasMod(mods, "DC")) {
                const mod = Mods.getMod(mods, "HT") || Mods.getMod(mods, "DC");
                mods.speed = mod?.settings?.speed_change || 0.75;
                if (mod?.settings && !mod.settings.speed_change) {
                    mods.speed = 0.75;
                }
            }
        }

        static isNoMod(mods) {
            return mods.data.length === 0;
        }

        static addMod(mods, mod) {
            if (Mods.hasMod(mods, mod)) return;
            mods.data.push({ acronym: mod });
        }

        static hasMod(mods, mod) {
            return mods.data.find(m => m.acronym === mod) !== undefined;
        }

        static hasMods(mods, acronyms) {
            //return true if all the mods are present
            return acronyms.every(acronym => mods.data.find(m => m.acronym === acronym) !== undefined);
        }

        static getMod(mods, mod) {
            return mods.data.find(m => m.acronym === mod);
        }

        static getMods(mods) {
            return mods.data;
        }

        static hasExactMods(mods, acronyms) {
            //return true if the mods are exactly the same
            if (mods.data.length !== acronyms.length) return false;
            return mods.data.every(m => acronyms.includes(m.acronym));
        }

        static containsSettings(mods) {
            return mods.data.some(m => m.settings !== undefined);
        }

        static containsSetting(mods, setting) {
            return mods.data.some(m => m.settings !== undefined && m.settings[setting] !== undefined);
        }

        static getSetting(mods, setting) {
            return mods.data.find(m => m.settings !== undefined && m.settings[setting] !== undefined);
        }

        static getModSetting(mods, mod, setting) {
            if (!Mods.hasMod(mods, mod)) return null;
            return Mods.getMod(mods, mod)?.settings?.[setting] || null;
        }

        static setModSetting(mods, mod, setting, value) {
            console.log('checking mod', mod, setting, value);
            if (!Mods.hasMod(mods, mod)) return null;
            const modObj = Mods.getMod(mods, mod);
            console.log('checking settings');
            if (!modObj.settings) modObj.settings = {};
            modObj.settings[setting] = value;
            Mods.updateSpeed(mods);
        }

        static toggleByAcronym(mods, acronym) {
            if (!mods) return null;
            if (Mods.hasMod(mods, acronym)) {
                mods.data = mods.data.filter(m => m.acronym !== acronym);
            } else {
                //add mod to mods
                Mods.addMod(mods, acronym);
            }
            Mods.updateSpeed(mods);
        }

        static getClockRate(mods) {
            let rate = 1;
            let freq = 1;
            let tempo = 1;
            for (const mod of mods.data) {
                if (Mods.isModSpeedChange(mod)) {
                    let freqAdjust = 1;
                    let tempoAdjust = Mods.getSpeedChangeFromMod(mod) ?? freqAdjust;

                    freq *= freqAdjust;
                    tempo *= tempoAdjust;
                }
            }

            rate = freq * tempo;

            return rate;
        }

        static getSpeedChangeFromMod(mod) {
            if (!Mods.isModSpeedChange(mod)) return 1;
            if (mod.settings?.speed_change) return mod.settings.speed_change;
            if (mod.acronym === "DT" || mod.acronym === "NC") return 1.5;
            if (mod.acronym === "HT" || mod.acronym === "DC") return 0.75;
        }

        static isModSpeedChange(mod) {
            return mod.acronym === "DT" || mod.acronym === "NC" || mod.acronym === "HT" || mod.acronym === "DC";
        }

        static async isModCompatible(mods, ruleset, acronym) {
            await modsDataMakeSure();
            if (!MODS_DATA) {
                console.error("Error fetching mods data");
                return false;
            }

            if (!mods) return false;
            if (!ruleset) ruleset = "osu";
            if (!acronym) return false;
            if (!MODS_DATA[ruleset]) return false;
            if (Mods.hasMod(mods, acronym)) return true;
            if (Mods.isNoMod(mods)) return true;

            //find the data for given acronym
            let INPUT_DATA = MODS_DATA[ruleset].find(mod => mod.Acronym === acronym);
            if (!INPUT_DATA) return false;

            let compatible = true;
            mods.data.forEach(mod => {
                let selected_acronym = mod.acronym;
                let CHECK_DATA = MODS_DATA[ruleset].find(m => m.Acronym === selected_acronym);
                if (!CHECK_DATA) return false;
                if (CHECK_DATA.IncompatibleMods.includes(INPUT_DATA.Acronym) || INPUT_DATA.IncompatibleMods.includes(CHECK_DATA.Acronym)) {
                    compatible = false;
                }
                if (!compatible) return false;
            });
            if (!compatible) return false;

            return true;
        }
    }

    let MODS_DATA = null;
    async function modsDataMakeSure() {
        if (MODS_DATA) return MODS_DATA;
        const response = await fetch("https://raw.githubusercontent.com/ppy/osu-web/refs/heads/master/database/mods.json");
        if (response.status === 200) {
            // MODS_DATA = await response.json();
            // return MODS_DATA;
            let temp_data = await response.json();
            MODS_DATA = {};
            for (const mod_set of temp_data) {
                let ruleset = mod_set.Name;
                MODS_DATA[ruleset] = mod_set.Mods;
            }
            return MODS_DATA;
        } else {
            console.error("Error fetching mods data", response.status, response.statusText);
            return null;
        }
    }

    let IS_RUNNER_ACTIVE = null;
    async function run(trigger = null) {
        if (IS_RUNNER_ACTIVE) {
            console.log("Runner is already active, skipping run. Trigger: ", trigger);
            return;
        };
        IS_RUNNER_ACTIVE = true;
        GM_addStyle(`
            .toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: hsl(var(--hsl-d5));
                color: #fff;
                padding: 15px;
                border-radius: 5px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                opacity: 0;
                transition: opacity 0.5s ease, transform 0.5s ease;
                transform: translateY(-80px);
                z-index: 9999;
            }

            .toast.show {
                opacity: 1;
                transform: translateY(0);
                transition: opacity 0.5s ease, transform 0.5s ease;
            }

            .beatmap-basic-stats {
                color: #fd5;
                display: flex;
                font-size: 11px;
                font-weight: 600;
                justify-content: space-between;
                box-sizing: border-box;
                gap: 2px;
            }

            .beatmap-basic-stats__entry {
                align-items: center;
                display: flex;
                flex: none;
                padding: 3px;
                box-sizing: border-box;
            }

            .ranking-page-table-main {
                gap: 5px;
            }

            .settings-button {
                position: fixed;
                width: 42px;
                height: 42px;
                right: 130px;
                cursor: pointer;
                z-index: 9999;
                background: url(${IMAGE_SETTINGS}) no-repeat center center;
                background-size: contain;
                border-radius: 5px;
                border: 1px solid hsl(var(--hsl-d5));
            }

            .settings-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 10000;
                cursor: pointer;
            }

            .settings-modal {
                position: fixed;
                min-width: 600px;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                border-radius: 5px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                background: hsl(var(--hsl-d5));
                z-index: 10001;
            }

            .profile-detail__values {
                gap: 15px;
            }

            .beatmap-scoreboard-mod--disabled {
                filter: grayscale(100%);
            }

            .mod-settings-container {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }

            .mod-icon-label {
                display: flex;
                gap: 5px;
            }

            .pp-calc-container {
                padding-top: 10px;
            }
        `);


        //if userpage
        if (window.location.href.includes("/users/")) {
            //override css font-size for class "value-display__value"
            GM_addStyle(`
                .value-display--rank .value-display__value {
                    font-size: 20px;
                }

                .value-display__label {
                    font-size: 14px;
                }
            `);
        }
        //check for id "osuplusSettingsBtn"
        //wait for osuplusSettingsBtn
        try {
        } catch (err) {
            console.error(err);
        }

        IS_RUNNER_ACTIVE = false;
        console.log(`[inspector] run finished. Trigger: ${trigger}`);
    }

    function start() {
        run("start");
        document.addEventListener("turbo:load", () => run("turbo:load"));
    }
    start();

    //when finished resizing window, regenerate the chart (just resize wont work due to how to site works)
    window.addEventListener('resize', () => {
        if (_chart) {
            _chart.destroy();
            _chart = new Chart(document.getElementById("custom_rank_chart"), _chart_data);
        }
    });

    //url observer
    //triggers events when the url changes

    // let currentUrl = window.location.href;

    if (window.onurlchange === null) {
        console.log("[inspector] registering URL change observer");
        window.addEventListener('urlchange', function (e) {
            run("urlchange");
        });
    }
})();
