import { APIGetUserData } from "./api";
import settingsIcon from "./assets/settings.png";
import { addStyle, getValue, setValue } from "./gm_api";
import type { ISetting, ISettingsSection } from "./types/settings";

let SETTINGS_DATA: ISettingsSection[] = [
    {
        'title': 'Info',
        'description': 'Reload the page to see the changes take effect.',
    },
    {
        'title': 'API',
        'description': 'Please set your OAuth token (https://osu.ppy.sh/home/account/edit > New OAuth Application > No URL needed)',
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
                    try {
                        const userData = await APIGetUserData(2);
                        if (userData) {
                            alert("API credentials are valid! User data for user ID 2: " + userData.username);
                        } else {
                            alert("API credentials are invalid!");
                        }
                    } catch (error: any) {
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
                'name': 'Show beatmap media',
                'internal_name': 'beatmap_page_show_media',
                'type': 'checkbox',
                'default': true,
                'description': 'Show beatmap media (YouTube, Spotify..)',
            },
            // {
            //     'name': 'Show spinner count',
            //     'internal_name': 'beatmap_page_show_spinner_count',
            //     'type': 'checkbox',
            //     'default': true,
            //     'description': 'Show spinner count',
            // },
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
    },
    {
        'title': 'Leaderboards',
        'internal_name': 'leaderboards',
        'options': [
            {
                'name': 'Show score changes',
                'internal_name': 'leaderboards_show_score_changes',
                'type': 'checkbox',
                'default': true,
                'description': 'Show score changes',
            }
            // {
            //     'name': 'Separate flags column',
            //     'internal_name': 'leaderboards_separate_flags_column',
            //     'type': 'checkbox',
            //     'default': true,
            //     'description': 'Show a separate column for flags instead of merging them with the user column',
            // },
        ]
    }
]

let active_settings: any = null;
export function createSettings() {
    applyStyles();

    let existingButton = document.getElementById("inspector_settings_button");
    if (existingButton) {
        //destroy it
        existingButton.remove();
        //safer than just returning, turbopage loads can cause desync or whatever, where the button is removed right after our check
    }

    (async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const element = document.createElement("div");
        element.classList.add("settings-button");
        element.id = "inspector_settings_button";

        //tooltip
        element.setAttribute("title", "inspector settings");
        element.setAttribute("data-tooltip", "inspector settings");

        //add to body at index 0
        document.body.insertBefore(element, document.body.firstChild);
        element.addEventListener("click", () => {
            createSettingsPanel();
        });
    })();
}

function applyStyles() {
    addStyle(`
        .settings-button {
                position: fixed;
                width: 42px;
                height: 42px;
                right: 130px;
                cursor: pointer;
                z-index: 9999;
                background: url(${settingsIcon}) no-repeat center center;
                background-size: contain;
                border-radius: 5px;
                border: 1px solid hsl(var(--hsl-d5));
            }
        `);

    addStyle(`
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
        `);

    addStyle(`
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
        `);
}

function createSettingsPanel() {
    if (active_settings) {
        active_settings.remove();
        active_settings = null;
    }

    const overlay = document.createElement("div");
    overlay.classList.add("settings-modal-overlay", "osu-page--account-edit");
    document.body.appendChild(overlay);
    overlay.addEventListener("click", () => {
        overlay.remove();
        active_settings?.remove();
        active_settings = null;
    });

    const settings = document.createElement("div");
    settings.classList.add("osu-page", "osu-page--account-edit", "settings-modal");
    active_settings = settings;

    SETTINGS_DATA.forEach((setting) => {
        settings.appendChild(createSettingsSection(setting));
    });

    document.body.appendChild(settings);
}

function createSettingsSection(section: ISettingsSection) {
    const section_container = document.createElement("div");
    section_container.classList.add("account-edit");

    const section_title_container = document.createElement("div");
    section_title_container.classList.add("account-edit__section");
    section_container.appendChild(section_title_container);

    const section_title = document.createElement("h2");
    section_title.classList.add("account-edit__section-title");

    section_title.textContent = section.title;
    section_title_container.appendChild(section_title);

    const section_input_groups_container = document.createElement("div");
    section_input_groups_container.classList.add("account-edit__input-groups");
    section_container.appendChild(section_input_groups_container);

    const section_input_group = document.createElement("div");
    section_input_group.classList.add("account-edit__input-group");
    section_input_groups_container.appendChild(section_input_group);

    if (section.description) {
        const row = document.createElement("div");
        row.classList.add("account-edit-entry", "account-edit-entry--no-label", "js-account-edit");
        section_input_group.appendChild(row);

        const section_description = document.createElement("div");
        section_description.classList.add("account-edit-entry__rules");
        section_description.textContent = section.description;
        row.appendChild(section_description);
    }

    if (section.options && section.options.length > 0) {
        section.options.forEach((option: ISetting) => {
            section_input_group.appendChild(createSettingsOptionRow(section, option));
        });
    }

    return section_container;
}

function createSettingsOptionRow(section: ISettingsSection, setting: ISetting) {
    let option_internal_name = `${setting.internal_name}`;
    let option_internal_value = getValue(option_internal_name, setting.default);

    let row_content = null;
    switch (setting.type) {
        case "checkbox":
            row_content = createSettingsOptionCheckbox(setting, option_internal_name, option_internal_value);
            break;
        case "text":
            row_content = createSettingsOptionText(setting, option_internal_name, option_internal_value, setting.is_password);
            break;
        case "button":
            row_content = createSettingsOptionButton(setting);
            break;
    }

    if (!row_content) {
        row_content = document.createElement("div");
        row_content.textContent = 'Something went wrong creating this option row';
        row_content.classList.add("account-edit__input-group--error");
    }

    return row_content;
}

function createSettingsOptionCheckbox(setting: ISetting, name: string, value: boolean) {
    const row = document.createElement("div");
    row.classList.add("account-edit-entry", "account-edit-entry--no-label", "js-account-edit");

    const label = document.createElement("label");
    label.classList.add("account-edit-entry__checkbox");
    row.appendChild(label);

    const switch_label = document.createElement("label");
    switch_label.classList.add("osu-switch-v2");
    label.appendChild(switch_label);

    const switch_input = document.createElement("input");
    switch_input.classList.add("osu-switch-v2__input", "js-account-edit__input");
    switch_input.type = "checkbox";
    switch_input.checked = value;
    switch_label.appendChild(switch_input);

    const switch_styling = document.createElement("span");
    switch_styling.classList.add("osu-switch-v2__content");
    switch_label.appendChild(switch_styling);

    const text_label = document.createElement("span");
    text_label.classList.add("account-edit-entry__checkbox-label");
    text_label.textContent = setting.description ?? 'No description';
    label.appendChild(text_label);

    switch_input.addEventListener("change", () => {
        setValue(name, switch_input.checked);
        console.log(`[inspector] ${name} set to ${switch_input.checked}`);
    });

    return row;
}

function createSettingsOptionText(setting: ISetting, name: string, value: string, is_password: boolean = false) {
    const row = document.createElement("div");
    row.classList.add("account-edit-entry", "js-account-edit", "js-form-error", "js-form-error--field");

    const input = document.createElement("input");
    input.classList.add("account-edit-entry__input", "js-account-edit__input");
    input.type = is_password ? "password" : "text";

    const label = document.createElement("div");
    label.classList.add("account-edit-entry__label");
    label.textContent = setting.name;
    row.appendChild(label);
    row.appendChild(input);

    input.value = value;

    input.addEventListener("change", () => {
        setValue(name, input.value);
        console.log(`[inspector] ${name} set to ${input.value}`);
    });

    return row;
}

function createSettingsOptionButton(setting: ISetting) {
    const row = document.createElement("div");
    row.classList.add("account-edit-entry", "account-edit-entry--no-label");

    const button = document.createElement("button");
    button.classList.add("btn-osu-big", "btn-osu-big--account-edit");
    button.textContent = setting.name;
    button.type = "button";
    row.appendChild(button);

    if (setting.onClick) {
        button.addEventListener("click", async () => {
            await setting.onClick?.();
        });
    }

    return row;
}
