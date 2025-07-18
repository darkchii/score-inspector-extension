// ==UserScript==
// @name         osu! scores inspector
// @namespace    https://score.kirino.sh
// @version      2025-07-14.66
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

    // const SCORE_INSPECTOR_API = "http://localhost:3863/";
    const SCORE_INSPECTOR_API = "https://api.kirino.sh/inspector/";

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
            'title': 'Leaderboards',
            'internal_name': 'leaderboards',
            'options': [
                {
                    'name': 'Replace accuracy with completion percentage',
                    'internal_name': 'leaderboards_replace_accuracy',
                    'type': 'checkbox',
                    'default': true,
                    'description': 'Replace accuracy with completion percentage (ranked score, standard only)',
                },
                {
                    'name': 'Show changes in score and score rank',
                    'internal_name': 'leaderboards_show_score_changes',
                    'type': 'checkbox',
                    'default': true,
                    'description': 'Show changes in score and score rank',
                },
                {
                    'name': 'Create seperate flags column',
                    'internal_name': 'leaderboards_seperate_flags_column',
                    'type': 'checkbox',
                    'default': true,
                    'description': 'Create a separate column for flags (makes usernames vertically aligned)',
                },
                {
                    'name': 'Show country flags',
                    'internal_name': 'leaderboards_show_country_flags',
                    'type': 'checkbox',
                    'default': true,
                    'description': 'Show country flags',
                },
                {
                    'name': 'Show team flags',
                    'internal_name': 'leaderboards_show_team_flags',
                    'type': 'checkbox',
                    'default': true,
                    'description': 'Show team flags',
                },
                {
                    'name': 'Show avatars',
                    'internal_name': 'leaderboards_show_avatars',
                    'type': 'checkbox',
                    'default': true,
                    'description': 'Show avatars',
                }
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
    const COE_ATTENDEE_TYPES = {
        'SPECTATOR_ONE_DAY': 'Spectator (1 day)',
        'SPECTATOR_ALL_DAYS': 'Spectator (all days)',
        'BYOC_ALL_DAYS': 'BYOC (all days)',
        'SPECTATOR_MIDWEEK': 'Spectator (midweek)',
        'SPECTATOR_WEEKEND': 'Spectator (weekend)',
        'BYOC_WEEKEND': 'BYOC (weekend)',
        'BYOC_MIDWEEK': 'BYOC (midweek)',
        'CAVE_MAIN': 'Cave',
        'CAVE_GUEST': 'Cave Guest',
        'BYOC_PREM_ALL_DAYS': 'BYOC+ (all days)',
    }

    const COUNTRY_DATA = [
        { acronym: 'A1', name: 'Anonymous Proxy', display: 0 },
        { acronym: 'A2', name: 'Satellite Provider', display: 0 },
        { acronym: 'AD', name: 'Andorra', display: 0 },
        { acronym: 'AE', name: 'United Arab Emirates', display: 1 },
        { acronym: 'AF', name: 'Afghanistan', display: 0 },
        { acronym: 'AG', name: 'Antigua and Barbuda', display: 0 },
        { acronym: 'AI', name: 'Anguilla', display: 0 },
        { acronym: 'AL', name: 'Albania', display: 0 },
        { acronym: 'AM', name: 'Armenia', display: 0 },
        { acronym: 'AN', name: 'Netherlands Antilles', display: 0 },
        { acronym: 'AO', name: 'Angola', display: 0 },
        { acronym: 'AP', name: 'Asia/Pacific Region', display: 0 },
        { acronym: 'AQ', name: 'Antarctica', display: 0 },
        { acronym: 'AR', name: 'Argentina', display: 1 },
        { acronym: 'AS', name: 'American Samoa', display: 0 },
        { acronym: 'AT', name: 'Austria', display: 1 },
        { acronym: 'AU', name: 'Australia', display: 2 },
        { acronym: 'AW', name: 'Aruba', display: 0 },
        { acronym: 'AX', name: 'Aland Islands', display: 0 },
        { acronym: 'AZ', name: 'Azerbaijan', display: 1 },
        { acronym: 'BA', name: 'Bosnia and Herzegovina', display: 0 },
        { acronym: 'BB', name: 'Barbados', display: 1 },
        { acronym: 'BD', name: 'Bangladesh', display: 1 },
        { acronym: 'BE', name: 'Belgium', display: 1 },
        { acronym: 'BF', name: 'Burkina Faso', display: 0 },
        { acronym: 'BG', name: 'Bulgaria', display: 1 },
        { acronym: 'BH', name: 'Bahrain', display: 1 },
        { acronym: 'BI', name: 'Burundi', display: 0 },
        { acronym: 'BJ', name: 'Benin', display: 0 },
        { acronym: 'BL', name: 'Saint Barthelemy', display: 0 },
        { acronym: 'BM', name: 'Bermuda', display: 0 },
        { acronym: 'BN', name: 'Brunei', display: 1 },
        { acronym: 'BO', name: 'Bolivia', display: 0 },
        { acronym: 'BR', name: 'Brazil', display: 1 },
        { acronym: 'BS', name: 'Bahamas', display: 0 },
        { acronym: 'BT', name: 'Bhutan', display: 1 },
        { acronym: 'BV', name: 'Bouvet Island', display: 0 },
        { acronym: 'BW', name: 'Botswana', display: 1 },
        { acronym: 'BY', name: 'Belarus', display: 1 },
        { acronym: 'BZ', name: 'Belize', display: 0 },
        { acronym: 'CA', name: 'Canada', display: 1 },
        { acronym: 'CC', name: 'Cocos (Keeling) Islands', display: 0 },
        { acronym: 'CD', name: 'Congo, The Democratic Republic of the', display: 0 },
        { acronym: 'CF', name: 'Central African Republic', display: 0 },
        { acronym: 'CG', name: 'Congo', display: 0 },
        { acronym: 'CH', name: 'Switzerland', display: 1 },
        { acronym: 'CI', name: "Cote D'Ivoire", display: 1 },
        { acronym: 'CK', name: 'Cook Islands', display: 0 },
        { acronym: 'CL', name: 'Chile', display: 1 },
        { acronym: 'CM', name: 'Cameroon', display: 0 },
        { acronym: 'CN', name: 'China', display: 1 },
        { acronym: 'CO', name: 'Colombia', display: 1 },
        { acronym: 'CR', name: 'Costa Rica', display: 1 },
        { acronym: 'CU', name: 'Cuba', display: 1 },
        { acronym: 'CV', name: 'Cabo Verde', display: 0 },
        { acronym: 'CX', name: 'Christmas Island', display: 0 },
        { acronym: 'CY', name: 'Cyprus', display: 1 },
        { acronym: 'CZ', name: 'Czechia', display: 1 },
        { acronym: 'DE', name: 'Germany', display: 2 },
        { acronym: 'DJ', name: 'Djibouti', display: 1 },
        { acronym: 'DK', name: 'Denmark', display: 1 },
        { acronym: 'DM', name: 'Dominica', display: 0 },
        { acronym: 'DO', name: 'Dominican Republic', display: 0 },
        { acronym: 'DZ', name: 'Algeria', display: 1 },
        { acronym: 'EC', name: 'Ecuador', display: 1 },
        { acronym: 'EE', name: 'Estonia', display: 1 },
        { acronym: 'EG', name: 'Egypt', display: 1 },
        { acronym: 'EH', name: 'Western Sahara', display: 0 },
        { acronym: 'ER', name: 'Eritrea', display: 0 },
        { acronym: 'ES', name: 'Spain', display: 1 },
        { acronym: 'ET', name: 'Ethiopia', display: 1 },
        { acronym: 'EU', name: 'Europe', display: 0 },
        { acronym: 'FI', name: 'Finland', display: 1 },
        { acronym: 'FJ', name: 'Fiji', display: 1 },
        { acronym: 'FK', name: 'Falkland Islands (Malvinas)', display: 0 },
        { acronym: 'FM', name: 'Micronesia, Federated States of', display: 0 },
        { acronym: 'FO', name: 'Faroe Islands', display: 0 },
        { acronym: 'FR', name: 'France', display: 2 },
        { acronym: 'FX', name: 'France, Metropolitan', display: 0 },
        { acronym: 'GA', name: 'Gabon', display: 1 },
        { acronym: 'GB', name: 'United Kingdom', display: 2 },
        { acronym: 'GD', name: 'Grenada', display: 0 },
        { acronym: 'GE', name: 'Georgia', display: 0 },
        { acronym: 'GF', name: 'French Guiana', display: 0 },
        { acronym: 'GG', name: 'Guernsey', display: 0 },
        { acronym: 'GH', name: 'Ghana', display: 1 },
        { acronym: 'GI', name: 'Gibraltar', display: 0 },
        { acronym: 'GL', name: 'Greenland', display: 0 },
        { acronym: 'GM', name: 'Gambia', display: 0 },
        { acronym: 'GN', name: 'Guinea', display: 0 },
        { acronym: 'GP', name: 'Guadeloupe', display: 0 },
        { acronym: 'GQ', name: 'Equatorial Guinea', display: 0 },
        { acronym: 'GR', name: 'Greece', display: 1 },
        { acronym: 'GS', name: 'South Georgia and the South Sandwich Islands', display: 0 },
        { acronym: 'GT', name: 'Guatemala', display: 0 },
        { acronym: 'GU', name: 'Guam', display: 1 },
        { acronym: 'GW', name: 'Guinea-Bissau', display: 0 },
        { acronym: 'GY', name: 'Guyana', display: 0 },
        { acronym: 'HK', name: 'Hong Kong', display: 1 },
        { acronym: 'HM', name: 'Heard Island and McDonald Islands', display: 0 },
        { acronym: 'HN', name: 'Honduras', display: 1 },
        { acronym: 'HR', name: 'Croatia', display: 1 },
        { acronym: 'HT', name: 'Haiti', display: 0 },
        { acronym: 'HU', name: 'Hungary', display: 1 },
        { acronym: 'ID', name: 'Indonesia', display: 2 },
        { acronym: 'IE', name: 'Ireland', display: 1 },
        { acronym: 'IL', name: 'Israel', display: 1 },
        { acronym: 'IM', name: 'Isle of Man', display: 0 },
        { acronym: 'IN', name: 'India', display: 1 },
        { acronym: 'IO', name: 'British Indian Ocean Territory', display: 0 },
        { acronym: 'IQ', name: 'Iraq', display: 1 },
        { acronym: 'IR', name: 'Iran, Islamic Republic of', display: 1 },
        { acronym: 'IS', name: 'Iceland', display: 1 },
        { acronym: 'IT', name: 'Italy', display: 1 },
        { acronym: 'JE', name: 'Jersey', display: 0 },
        { acronym: 'JM', name: 'Jamaica', display: 1 },
        { acronym: 'JO', name: 'Jordan', display: 1 },
        { acronym: 'JP', name: 'Japan', display: 1 },
        { acronym: 'KE', name: 'Kenya', display: 1 },
        { acronym: 'KG', name: 'Kyrgyzstan', display: 0 },
        { acronym: 'KH', name: 'Cambodia', display: 1 },
        { acronym: 'KI', name: 'Kiribati', display: 0 },
        { acronym: 'KM', name: 'Comoros', display: 0 },
        { acronym: 'KN', name: 'Saint Kitts and Nevis', display: 0 },
        { acronym: 'KP', name: "Korea, Democratic People's Republic of", display: 0 },
        { acronym: 'KR', name: 'South Korea', display: 2 },
        { acronym: 'KW', name: 'Kuwait', display: 1 },
        { acronym: 'KY', name: 'Cayman Islands', display: 0 },
        { acronym: 'KZ', name: 'Kazakhstan', display: 0 },
        { acronym: 'LA', name: "Lao People's Democratic Republic", display: 0 },
        { acronym: 'LB', name: 'Lebanon', display: 0 },
        { acronym: 'LC', name: 'Saint Lucia', display: 0 },
        { acronym: 'LI', name: 'Liechtenstein', display: 1 },
        { acronym: 'LK', name: 'Sri Lanka', display: 1 },
        { acronym: 'LR', name: 'Liberia', display: 0 },
        { acronym: 'LS', name: 'Lesotho', display: 0 },
        { acronym: 'LT', name: 'Lithuania', display: 1 },
        { acronym: 'LU', name: 'Luxembourg', display: 1 },
        { acronym: 'LV', name: 'Latvia', display: 1 },
        { acronym: 'LY', name: 'Libya', display: 0 },
        { acronym: 'MA', name: 'Morocco', display: 1 },
        { acronym: 'MC', name: 'Monaco', display: 1 },
        { acronym: 'MD', name: 'Moldova', display: 0 },
        { acronym: 'ME', name: 'Montenegro', display: 0 },
        { acronym: 'MF', name: 'Saint Martin', display: 0 },
        { acronym: 'MG', name: 'Madagascar', display: 1 },
        { acronym: 'MH', name: 'Marshall Islands', display: 0 },
        { acronym: 'MK', name: 'North Macedonia', display: 1 },
        { acronym: 'ML', name: 'Mali', display: 0 },
        { acronym: 'MM', name: 'Myanmar', display: 1 },
        { acronym: 'MN', name: 'Mongolia', display: 1 },
        { acronym: 'MO', name: 'Macau', display: 0 },
        { acronym: 'MP', name: 'Northern Mariana Islands', display: 0 },
        { acronym: 'MQ', name: 'Martinique', display: 0 },
        { acronym: 'MR', name: 'Mauritania', display: 0 },
        { acronym: 'MS', name: 'Montserrat', display: 0 },
        { acronym: 'MT', name: 'Malta', display: 1 },
        { acronym: 'MU', name: 'Mauritius', display: 1 },
        { acronym: 'MV', name: 'Maldives', display: 1 },
        { acronym: 'MW', name: 'Malawi', display: 0 },
        { acronym: 'MX', name: 'Mexico', display: 1 },
        { acronym: 'MY', name: 'Malaysia', display: 2 },
        { acronym: 'MZ', name: 'Mozambique', display: 0 },
        { acronym: 'NA', name: 'Namibia', display: 0 },
        { acronym: 'NC', name: 'New Caledonia', display: 1 },
        { acronym: 'NE', name: 'Niger', display: 0 },
        { acronym: 'NF', name: 'Norfolk Island', display: 0 },
        { acronym: 'NG', name: 'Nigeria', display: 1 },
        { acronym: 'NI', name: 'Nicaragua', display: 0 },
        { acronym: 'NL', name: 'Netherlands', display: 1 },
        { acronym: 'NO', name: 'Norway', display: 1 },
        { acronym: 'NP', name: 'Nepal', display: 1 },
        { acronym: 'NR', name: 'Nauru', display: 0 },
        { acronym: 'NU', name: 'Niue', display: 0 },
        { acronym: 'NZ', name: 'New Zealand', display: 1 },
        { acronym: 'O1', name: 'Other', display: 0 },
        { acronym: 'OM', name: 'Oman', display: 1 },
        { acronym: 'PA', name: 'Panama', display: 1 },
        { acronym: 'PE', name: 'Peru', display: 1 },
        { acronym: 'PF', name: 'French Polynesia', display: 0 },
        { acronym: 'PG', name: 'Papua New Guinea', display: 1 },
        { acronym: 'PH', name: 'Philippines', display: 1 },
        { acronym: 'PK', name: 'Pakistan', display: 1 },
        { acronym: 'PL', name: 'Poland', display: 1 },
        { acronym: 'PM', name: 'Saint Pierre and Miquelon', display: 0 },
        { acronym: 'PN', name: 'Pitcairn', display: 0 },
        { acronym: 'PR', name: 'Puerto Rico', display: 0 },
        { acronym: 'PS', name: 'Palestine, State of', display: 0 },
        { acronym: 'PT', name: 'Portugal', display: 1 },
        { acronym: 'PW', name: 'Palau', display: 0 },
        { acronym: 'PY', name: 'Paraguay', display: 1 },
        { acronym: 'QA', name: 'Qatar', display: 1 },
        { acronym: 'RE', name: 'Reunion', display: 0 },
        { acronym: 'RO', name: 'Romania', display: 1 },
        { acronym: 'RS', name: 'Serbia', display: 0 },
        { acronym: 'RU', name: 'Russian Federation', display: 1 },
        { acronym: 'RW', name: 'Rwanda', display: 0 },
        { acronym: 'SA', name: 'Saudi Arabia', display: 1 },
        { acronym: 'SB', name: 'Solomon Islands', display: 0 },
        { acronym: 'SC', name: 'Seychelles', display: 0 },
        { acronym: 'SD', name: 'Sudan', display: 1 },
        { acronym: 'SE', name: 'Sweden', display: 2 },
        { acronym: 'SG', name: 'Singapore', display: 2 },
        { acronym: 'SH', name: 'Saint Helena', display: 0 },
        { acronym: 'SI', name: 'Slovenia', display: 1 },
        { acronym: 'SJ', name: 'Svalbard and Jan Mayen', display: 0 },
        { acronym: 'SK', name: 'Slovakia', display: 1 },
        { acronym: 'SL', name: 'Sierra Leone', display: 1 },
        { acronym: 'SM', name: 'San Marino', display: 0 },
        { acronym: 'SN', name: 'Senegal', display: 1 },
        { acronym: 'SO', name: 'Somalia', display: 0 },
        { acronym: 'SR', name: 'Suriname', display: 0 },
        { acronym: 'ST', name: 'Sao Tome and Principe', display: 0 },
        { acronym: 'SV', name: 'El Salvador', display: 1 },
        { acronym: 'SY', name: 'Syrian Arab Republic', display: 1 },
        { acronym: 'SZ', name: 'Eswatini', display: 0 },
        { acronym: 'TC', name: 'Turks and Caicos Islands', display: 0 },
        { acronym: 'TD', name: 'Chad', display: 0 },
        { acronym: 'TF', name: 'French Southern Territories', display: 0 },
        { acronym: 'TG', name: 'Togo', display: 1 },
        { acronym: 'TH', name: 'Thailand', display: 1 },
        { acronym: 'TJ', name: 'Tajikistan', display: 0 },
        { acronym: 'TK', name: 'Tokelau', display: 0 },
        { acronym: 'TL', name: 'Timor-Leste', display: 0 },
        { acronym: 'TM', name: 'Turkmenistan', display: 0 },
        { acronym: 'TN', name: 'Tunisia', display: 1 },
        { acronym: 'TO', name: 'Tonga', display: 0 },
        { acronym: 'TR', name: 'Türkiye', display: 1 },
        { acronym: 'TT', name: 'Trinidad and Tobago', display: 1 },
        { acronym: 'TV', name: 'Tuvalu', display: 0 },
        { acronym: 'TW', name: 'Taiwan', display: 1 },
        { acronym: 'TZ', name: 'Tanzania, United Republic of', display: 1 },
        { acronym: 'UA', name: 'Ukraine', display: 1 },
        { acronym: 'UG', name: 'Uganda', display: 0 },
        { acronym: 'UM', name: 'United States Minor Outlying Islands', display: 0 },
        { acronym: 'US', name: 'United States', display: 2 },
        { acronym: 'UY', name: 'Uruguay', display: 1 },
        { acronym: 'UZ', name: 'Uzbekistan', display: 0 },
        { acronym: 'VA', name: 'Holy See (Vatican City State)', display: 0 },
        { acronym: 'VC', name: 'Saint Vincent and the Grenadines', display: 0 },
        { acronym: 'VE', name: 'Venezuela', display: 1 },
        { acronym: 'VG', name: 'Virgin Islands, British', display: 0 },
        { acronym: 'VI', name: 'Virgin Islands, U.S.', display: 0 },
        { acronym: 'VN', name: 'Vietnam', display: 1 },
        { acronym: 'VU', name: 'Vanuatu', display: 0 },
        { acronym: 'WF', name: 'Wallis and Futuna', display: 0 },
        { acronym: 'WS', name: 'Samoa', display: 0 },
        { acronym: 'XX', name: '', display: 0 },
        { acronym: 'YE', name: 'Yemen', display: 0 },
        { acronym: 'YT', name: 'Mayotte', display: 0 },
        { acronym: 'ZA', name: 'South Africa', display: 1 },
        { acronym: 'ZM', name: 'Zambia', display: 0 },
        { acronym: 'ZW', name: 'Zimbabwe', display: 1 }
    ];

    // let CURRENT_GRAPH = 'Performance';
    let CURRENT_GRAPH = GM_getValue("inspector_current_graph", "Performance");

    //lets script know what elements to wait for before running
    const PAGE_ELEMENT_WAIT_LIST = {
        'user_page': '.profile-info__name',
    }

    const CUSTOM_RANKINGS_ATTRIBUTES = {
        performance: {
            name: "Performance",
            val: (user) => {
                return user.pp;
            },
            formatter: (value) => {
                return `${value.toLocaleString()}pp`;
            },
            tooltip_formatter: (value) => {
                return value.toLocaleString();
            }
        },
        total_pp: {
            name: "Total PP",
            val: (user) => {
                return user.total_pp;
            },
            formatter: (value) => {
                return shortNum(value);
            },
            tooltip_formatter: (value) => {
                return value.toLocaleString();
            }
        },
        accuracy: {
            name: "Accuracy",
            val: (user) => {
                return user.accuracy;
            },
            formatter: (value) => {
                return `${value.toFixed(2)}%`;
            },
            tooltip_formatter: (value) => {
                return `${value.toFixed(2)}%`;
            }
        },
        badges: {
            name: "Badges",
            val: (user) => {
                return user.badges;
            }
        },
        medals: {
            name: "Medals",
            val: (user) => {
                return user.medals;
            }
        },
        members: {
            name: "Members",
            val: (user) => {
                return user.members;
            }
        },
        total_score: {
            name: "Total Score",
            val: (user) => {
                return user.total_score;
            },
            formatter: (value) => {
                return shortNum(value);
            },
            tooltip_formatter: (value) => {
                return value.toLocaleString();
            }
        },
        ranked_score: {
            name: "Ranked Score",
            val: (user) => {
                return user.ranked_score;
            },
            formatter: (value) => {
                return shortNum(value);
            },
            tooltip_formatter: (value) => {
                return value.toLocaleString();
            }
        },
        ss: {
            name: "SS",
            val: (user) => {
                return user.ss_count + user.ssh_count;
            }
        },
        s: {
            name: "S",
            val: (user) => {
                return user.s_count + user.sh_count;
            }
        },
        a: {
            name: "A",
            val: (user) => {
                return user.a_count;
            }
        },
        b: {
            name: "B",
            val: (user) => {
                return user.b_count;
            }
        },
        c: {
            name: "C",
            val: (user) => {
                return user.c_count;
            }
        },
        d: {
            name: "D",
            val: (user) => {
                return user.d_count;
            }
        },
        clears: {
            name: "Clears",
            val: (user) => {
                return user.ss_count + user.ssh_count + user.s_count + user.sh_count + user.a_count;
            }
        },
        playtime: {
            name: "Playtime",
            val: (user) => {
                // return user.playtime;
                //convert to pretty format
                const hours = Math.floor(user.playtime / 3600);
                const minutes = Math.floor(user.playtime / 60) % 60;
                return `${hours}h ${minutes}m`;
            },
        },
        playcount: {
            name: "Playcount",
            val: (user) => {
                return user.playcount;
            },
        },
        replays_watched: {
            name: "Replays Watched",
            val: (user) => {
                return user.replays_watched;
            },
        },
        total_hits: {
            name: "Total Hits",
            val: (user) => {
                return user.total_hits;
            },
        },
        xp: {
            name: "XP",
            val: (user) => {
                return user.xp;
            },
        }
    }

    const CUSTOM_RANKINGS = [
        {
            name: "total score",
            api_path: "total_score",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
            ],
            path: "/rankings/osu/total_score"
        },
        {
            name: "total ss",
            api_path: "ss",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.b],
                [CUSTOM_RANKINGS_ATTRIBUTES.c],
                [CUSTOM_RANKINGS_ATTRIBUTES.d]
            ],
            path: "/rankings/osu/ss"
        },
        {
            name: "total s",
            api_path: "s",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.b],
                [CUSTOM_RANKINGS_ATTRIBUTES.c],
                [CUSTOM_RANKINGS_ATTRIBUTES.d]
            ],
            path: "/rankings/osu/s"
        },
        {
            name: "total a",
            api_path: "a",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.b],
                [CUSTOM_RANKINGS_ATTRIBUTES.c],
                [CUSTOM_RANKINGS_ATTRIBUTES.d]
            ],
            path: "/rankings/osu/a"
        },
        {
            name: "total b",
            api_path: "b",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.b, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.c],
                [CUSTOM_RANKINGS_ATTRIBUTES.d]
            ],
            path: "/rankings/osu/b"
        },
        {
            name: "total c",
            api_path: "c",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.b],
                [CUSTOM_RANKINGS_ATTRIBUTES.c, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.d]
            ],
            path: "/rankings/osu/c"
        },
        {
            name: "total d",
            api_path: "d",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
                [CUSTOM_RANKINGS_ATTRIBUTES.b],
                [CUSTOM_RANKINGS_ATTRIBUTES.c],
                [CUSTOM_RANKINGS_ATTRIBUTES.d, true]
            ],
            path: "/rankings/osu/d"
        },
        {
            name: "profile clears",
            api_path: "clears",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.clears, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
            ],
            path: "/rankings/osu/clears"
        },
        {
            name: "playtime",
            api_path: "playtime",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.playtime, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
            ],
            path: "/rankings/osu/playtime"
        },
        {
            name: "playcount",
            api_path: "playcount",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.playcount, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
            ],
            path: "/rankings/osu/playcount"
        },
        {
            name: "total hits",
            api_path: "total_hits",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.total_hits, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
            ],
            path: "/rankings/osu/total_hits"
        },
        {
            name: "replays watched",
            api_path: "replays_watched",
            attributes: [
                [CUSTOM_RANKINGS_ATTRIBUTES.total_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.ranked_score],
                [CUSTOM_RANKINGS_ATTRIBUTES.replays_watched, true],
                [CUSTOM_RANKINGS_ATTRIBUTES.ss],
                [CUSTOM_RANKINGS_ATTRIBUTES.s],
                [CUSTOM_RANKINGS_ATTRIBUTES.a],
            ],
            path: "/rankings/osu/replays_watched"
        }
    ]

    const lb_page_nav_items = [
        {
            name: "performance",
            attr: "global/performance",
            link: "/rankings/{mode}/global/performance",
        },
        {
            name: "score",
            attr: "global/score",
            link: "/rankings/{mode}/global/score",
        },
        ...CUSTOM_RANKINGS.map(ranking => {
            return {
                name: ranking.name,
                attr: ranking.api_path,
                link: ranking.path
            }
        }),
        {
            name: "country",
            attr: "country",
            link: "/rankings/{mode}/country"
        }, {
            name: "team",
            attr: "team",
            link: "/rankings/{mode}/team"
        }, {
            name: "multiplayer",
            attr: "multiplayer",
            link: "/multiplayer/rooms/latest"
        }, {
            name: "daily challenge",
            attr: "daily-challenge",
            link: "/rankings/daily-challenge/.*"
        }, {
            name: "seasons",
            attr: "seasons",
            link: "/seasons/.*",
            default_linker: "latest"
        }, {
            name: "spotlights (old)",
            attr: "spotlights",
            link: "/rankings/{mode}/charts"
        }, {
            name: "kudosu",
            attr: "kudosu",
            link: "/rankings/kudosu"
        }
    ]

    const OFFICIAL_LEADERBOARD_STRUCTURES = {
        'performance': () => {
            //its dynamic based on some settings so its a function
            return [
                "pos",
                'change',
                GM_getValue("leaderboards_seperate_flags_column", true) ? "flags" : undefined,
                "user",
                "accuracy", //or "completion", but same position
                "play_count",
                "ranked_score",
                "performance",
                "ss",
                "s",
                "a",
            ].filter(Boolean);
        },
        'score': () => {
            //its dynamic based on some settings so its a function
            return [
                "pos",
                GM_getValue("leaderboards_seperate_flags_column", true) ? "flags" : undefined,
                "user",
                "accuracy", //or "completion", but same position
                "play_count",
                "ranked_score",
                "performance",
                "ss",
                "s",
                "a",
            ].filter(Boolean);
        },
        'rooms': () => {
            return [
                "pos",
                GM_getValue("leaderboards_seperate_flags_column", true) ? "flags" : undefined,
                "user",
                "accuracy",
                "play_count",
                "total_score"
            ].filter(Boolean);
        },
        'daily-challenge': () => {
            return [
                "pos",
                GM_getValue("leaderboards_seperate_flags_column", true) ? "flags" : undefined,
                "user",
                "accuracy",
                "play_count",
                "total_score"
            ].filter(Boolean);
        },
        'seasons': () => {
            return [
                "pos",
                GM_getValue("leaderboards_seperate_flags_column", true) ? "flags" : undefined,
                "user",
                "total_score",
                "division",
            ].filter(Boolean);
        },
        'charts': () => {
            return [
                "pos",
                GM_getValue("leaderboards_seperate_flags_column", true) ? "flags" : undefined,
                "user",
                "accuracy",
                "play_count",
                "total_score",
                "ranked_score",
                "ss",
                "s",
                "a",
            ].filter(Boolean);
        },
        'kudosu': () => {
            return [
                "pos",
                GM_getValue("leaderboards_seperate_flags_column", true) ? "flags" : undefined,
                "user",
                "earned",
                "available",
                "spent",
            ].filter(Boolean);
        }
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
        if (IS_RUNNER_ACTIVE){
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
        try{
            createSettingsButton();
    
            if (window.location.href.includes("/rankings/") ||
                window.location.href.includes("/multiplayer/rooms/") ||
                window.location.href.includes("/seasons/")) {
                await handleLeaderboardPage(); //Run this BEFORE score rank stuff etc, since those check for added columns and index offsets
            }
    
            await runUserPage();
            if (GM_getValue("leaderboards_replace_accuracy", true)) {
                await runScoreRankCompletionPercentages();
            }
            if (GM_getValue("leaderboards_show_score_changes", true)) {
                await runScoreRankChanges();
            }
            await runScorePage();
            await runBeatmapPage();
    
            if (GM_getValue("teams_show_team_tags", true)) {
                await runUsernames();
            }
        }catch(err){
            console.error(err);
        }

        IS_RUNNER_ACTIVE = false;
        console.log(`[inspector] run finished. Trigger: ${trigger}`);
    }

    let active_settings = null;
    function createSettingsButton() {
        if (document.getElementById("inspector_settings_button")) {
            //destroy it
            document.getElementById("inspector_settings_button").remove();
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
                //TODO: open settings menu
                createSettingsPanel();
            });
        })();
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

    function createSettingsSection(section) {
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

        if (section.options?.length > 0) {
            section.options.forEach((option) => {
                section_input_group.appendChild(createSettingsOptionRow(section, option));
            });
        }

        return section_container;
    }

    function createSettingsOptionRow(section, setting) {
        let option_internal_name = `${setting.internal_name}`;
        let option_internal_value = GM_getValue(option_internal_name, setting.default);

        let row_content = null;
        switch (setting.type) {
            case "checkbox":
                row_content = createSettingsOptionCheckbox(setting, option_internal_name, option_internal_value);
                break;
        }

        if (!row_content) {
            row_content = document.createElement("div");
            row_content.textContent = 'Something went wrong creating this option row';
            row_content.classList.add("account-edit__input-group--error");
        }

        return row_content;
    }

    function createSettingsOptionCheckbox(setting, name, value) {
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
        text_label.textContent = setting.description;
        label.appendChild(text_label);

        switch_input.addEventListener("change", () => {
            GM_setValue(name, switch_input.checked);
            console.log(`[inspector] ${name} set to ${switch_input.checked}`);
        });

        return row;
    }

    function start() {
        run("start");
        document.addEventListener("turbo:load", () => run("turbo:load"));
    }
    start();

    async function runCleanErrorPage(title, subtitle, header_data = null) {
        document.title = `${title} · ${subtitle} | osu!`;

        const container = document.getElementsByClassName("osu-layout__section osu-layout__section--full")[0];
        container.innerHTML = "";

        let header_nav = null;

        if (header_data) {
            const rankings_container = document.createElement("div");
            rankings_container.classList.add("header-v4", "header-v4--rankings");
            container.appendChild(rankings_container);

            const rankings_header = document.createElement("div");
            rankings_header.classList.add("header-v4__container", "header-v4__container--main");
            rankings_container.appendChild(rankings_header);

            const rankings_header_bg_container = document.createElement("div");
            rankings_header_bg_container.classList.add("header-v4__bg-container");
            //bg color hsl(var(--hsl-d5))
            rankings_header_bg_container.style.backgroundColor = "hsl(var(--hsl-d5))";
            rankings_header.appendChild(rankings_header_bg_container);

            const rankings_header_bg_container_bg = document.createElement("div");
            rankings_header_bg_container_bg.classList.add("header-v4__bg");
            rankings_header_bg_container.appendChild(rankings_header_bg_container_bg);

            const rankings_header_content = document.createElement("div");
            rankings_header_content.classList.add("header-v4__content");
            rankings_header.appendChild(rankings_header_content);

            const rankings_header_content_title = document.createElement("div");
            rankings_header_content_title.classList.add("header-v4__row", "header-v4__row--title");
            rankings_header_content.appendChild(rankings_header_content_title);

            const rankings_header_content_title_icon = document.createElement("div");
            rankings_header_content_title_icon.classList.add("header-v4__icon");
            rankings_header_content_title.appendChild(rankings_header_content_title_icon);

            const rankings_header_content_title_text = document.createElement("div");
            rankings_header_content_title_text.classList.add("header-v4__title");
            rankings_header_content_title_text.textContent = header_data.title ?? "placeholder";
            rankings_header_content_title.appendChild(rankings_header_content_title_text);

            const ranking_headers_container = document.createElement("div");
            ranking_headers_container.classList.add("header-v4__container");
            rankings_container.appendChild(ranking_headers_container);

            const ranking_headers_content = document.createElement("div");
            ranking_headers_content.classList.add("header-v4__content");
            ranking_headers_container.appendChild(ranking_headers_content);

            const ranking_headers_row = document.createElement("div");
            ranking_headers_row.classList.add("header-v4__row", "header-v4__row--bar");
            ranking_headers_content.appendChild(ranking_headers_row);

            const ranking_headers_row_nav = document.createElement("ul");
            ranking_headers_row_nav.classList.add("header-nav-v4", "header-nav-v4--list");
            ranking_headers_row.appendChild(ranking_headers_row_nav);

            header_nav = ranking_headers_row_nav;
        }

        return { container, header_nav };
    }

    async function runScorePage() {
        if (!window.location.href.includes("/scores/")) {
            return;
        }

        try {
            let score_id = window.location.href.split("/")[4];

            if (!parseInt(score_id)) {
                console.error("Invalid score id");
                return;
            }
            score_id = parseInt(score_id);

            await modsDataMakeSure();

            const active_score = await getScoreData();

            //Apply the attributes to the current score view
            //get element class "score-stats__group score-stats__group--stats"
            const score_stats_group = document.getElementsByClassName("score-stats__group score-stats__group--stats")[0];

            const createStat = (name, value, light = false, title = null) => {
                const stat = document.createElement("div");
                stat.classList.add("score-stats__stat");

                const stat_name = document.createElement("div");
                stat_name.classList.add("score-stats__stat-row", "score-stats__stat-row--label");
                stat_name.textContent = name;
                stat.appendChild(stat_name);

                const stat_value = document.createElement("div");
                stat_value.classList.add("score-stats__stat-row");
                stat_value.textContent = value;
                if (light) {
                    //italics
                    stat_value.style.fontStyle = "italic";
                    stat_value.style.color = "lightgray";
                }

                if (title) {
                    //tooltip
                    stat_value.setAttribute("title", title);
                    stat_value.setAttribute("data-tooltip", title);
                    stat_value.setAttribute("data-orig-title", title);
                }
                stat.appendChild(stat_value);

                return stat;
            }
            //delete if id "score-stats__group-row--extra-stats" exists
            let score_stats_group_row = document.getElementById("score-stats__group-row--extra-stats");
            if (score_stats_group_row) {
                score_stats_group_row.remove();
            }
            score_stats_group_row = document.createElement("div");
            score_stats_group_row.classList.add("score-stats__group-row");
            score_stats_group_row.id = "score-stats__group-row--extra-stats";
            score_stats_group.appendChild(score_stats_group_row);
            score_stats_group_row.appendChild(createStat("Stars", `${formatNumber(active_score.difficulty.star_rating, 2)} ★`));
            switch (active_score.ruleset_id) {
                case 0: //osu
                    score_stats_group_row.appendChild(createStat("Aim", `${formatNumber(active_score.difficulty.aim_difficulty ?? 0, 2)}★`));
                    score_stats_group_row.appendChild(createStat("Speed", `${formatNumber(active_score.difficulty.speed_difficulty ?? 0, 2)}★`));
                    score_stats_group_row.appendChild(createStat("Flashlight", `${formatNumber(active_score.difficulty.flashlight_difficulty ?? 0, 2)}★`));
                    break;
            }

            const score_stats_group_row_top = document.getElementsByClassName("score-stats__group-row")[0];
            if (active_score.pp === null && active_score.calculator?.pp) {
                const pp_stat = [...score_stats_group.getElementsByClassName("score-stats__stat-row score-stats__stat-row--label")].find((el) => el.textContent == "pp");
                if (pp_stat) {
                    //remove it
                    pp_stat.parentElement.remove();
                }

                score_stats_group_row_top.appendChild(createStat("pp", `${formatNumber(active_score.calculator?.pp, 2)}`, true, 'Estimated performance'));
            }
            score_stats_group_row_top.appendChild(createStat("pp if fc", `${formatNumber(active_score.calculator_fc?.pp, 2)}`, true, `Estimated performance at ${formatNumber(active_score.fc_statistics?.accuracy * 100, 2)}% FC`));

            if (GM_getValue("score_page_show_user_scores", true)) {
                let ruleset_scores = {};
                let ruleset_beatmaps = {};

                //get scores for all rulesets
                for (const ruleset of MODE_SLUGS_ALT) {
                    const data = await getUserBeatmapScores(active_score.user_id, active_score.beatmap_id, ruleset);
                    const _scores = data.scores;
                    const _beatmap = data.beatmap;
                    const _attributes = data.attributes;

                    //sort by pp desc
                    _scores.sort((a, b) => {
                        return b.pp - a.pp;
                    });

                    if (_scores && _scores.length > 0) {
                        ruleset_scores[ruleset] = _scores;
                    }

                    if (_beatmap) {
                        ruleset_beatmaps[ruleset] = {
                            ..._beatmap,
                            attributes: _attributes
                        };
                    }
                }

                //find the element with class "score-stats"
                const score_stats = document.getElementsByClassName("score-stats")[0];

                //insert an empty div after the score-stats element (this will contain all extra scores)
                // const extra_scores_div = document.createElement("div");
                let extra_scores_div = document.getElementById("score-stats__group-row--extra-scores");
                if (extra_scores_div) {
                    extra_scores_div.remove();
                }
                extra_scores_div = document.createElement("div");
                extra_scores_div.classList.add("score-stats");
                extra_scores_div.id = "score-stats__group-row--extra-scores";
                //force full width
                extra_scores_div.style.width = "100%";

                //insert
                score_stats.parentNode.insertBefore(extra_scores_div, score_stats.nextSibling);

                //if scores is empty, just insert a message
                if (!ruleset_scores || Object.keys(ruleset_scores).length === 0) {
                    const no_scores = document.createElement("div");
                    no_scores.classList.add("no-scores");
                    no_scores.textContent = "User has no scores on this beatmap";
                    extra_scores_div.appendChild(no_scores);
                    return;
                } else {
                    const proxy_scoreboard_element = document.createElement("div");
                    proxy_scoreboard_element.classList.add("beatmapset-scoreboard");
                    proxy_scoreboard_element.style.width = "100%";

                    extra_scores_div.appendChild(proxy_scoreboard_element);
                    for (const ruleset of MODE_SLUGS_ALT) {
                        if (!ruleset_scores[ruleset]) continue;
                        const ruleset_id = MODE_SLUGS_ALT.indexOf(ruleset);

                        const proxy_scoreboard_item_element = document.createElement("div");
                        proxy_scoreboard_item_element.classList.add("beatmapset-scoreboard__main");

                        const ruleset_scores_container = document.createElement("div");
                        ruleset_scores_container.classList.add("beatmap-scoreboard-top__item");
                        proxy_scoreboard_item_element.appendChild(ruleset_scores_container);

                        // ruleset_scores_container.innerHTML = `<h3>${ruleset}</h3>`;
                        // extra_scores_div.appendChild(ruleset_scores_container);
                        const ruleset_scores_header = document.createElement("h4");
                        ruleset_scores_header.classList.add("ruleset-scores-header");

                        ruleset_scores_header.appendChild(getRulesetIconSpan(ruleset_id));

                        const ruleset_scores_header_text = document.createElement("span");
                        ruleset_scores_header_text.textContent = ` ${ruleset}`;
                        ruleset_scores_header.appendChild(ruleset_scores_header_text);

                        ruleset_scores_container.appendChild(ruleset_scores_header);
                        proxy_scoreboard_element.appendChild(proxy_scoreboard_item_element);

                        // const score_element = getUserScoreElement(scores[ruleset][0]);
                        // for (const [index, score] of scores[ruleset]) {
                        for (const [index, score] of ruleset_scores[ruleset].entries()) {
                            const score_element = getUserScoreElement(score, active_score.user, ruleset_beatmaps[ruleset], index);
                            if (!score_element) continue;

                            if (active_score.id == score.id) {
                                //add a subtle gold glow to the score element
                                //not a class, use inline style
                                score_element.style.boxShadow = "0 0 10px 5px rgba(255, 215, 0, 0.5)";
                            }

                            ruleset_scores_container.appendChild(score_element);
                        }
                    }
                }
            }
        } catch (err) {
            console.error(err);
        }

    }

    function getUserScoreElement(score, user, beatmap, index) {
        let time_ago = null;
        let time_ago_long = null;
        //time_ago is a simple string i.e: 2d (2 days ago), 1m (1 month ago), 1y (1 year ago)
        if (score.ended_at) {
            const date = new Date(score.ended_at);
            const now = new Date();
            const diff = now - date;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
            const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
            if (days <= 0) {
                time_ago = "now";
                time_ago_long = "now";
            } else if (days <= 30) {
                time_ago = `${days}d`;
                time_ago_long = `${days} day${days > 1 ? 's' : ''} ago`;
            } else if (months < 12) {
                time_ago = `${months}m`;
                time_ago_long = `${months} month${months > 1 ? 's' : ''} ago`;
            } else {
                time_ago = `${years}y`;
                time_ago_long = `${years} year${years > 1 ? 's' : ''} ago`;
            }
        } else {
            time_ago = "N/A";
            time_ago_long = "N/A";
        }

        //just make a test element and see if it works
        const score_element = document.createElement("div");
        score_element.classList.add("beatmap-scoreboard-top__item");

        const beatmap_score_top = document.createElement("div");
        beatmap_score_top.classList.add("beatmap-score-top");

        const score_element_link = document.createElement("a");
        score_element_link.classList.add("beatmap-score-top__link-container");
        score_element_link.href = `https://osu.ppy.sh/scores/${score.id}`;
        beatmap_score_top.appendChild(score_element_link);

        const beatmap_score_section = document.createElement("div");
        beatmap_score_section.classList.add("beatmap-score-top__section");
        //change padding to 5px
        beatmap_score_section.style.padding = "5px";

        beatmap_score_top.appendChild(beatmap_score_section);
        score_element.appendChild(beatmap_score_top);

        //Create user portion of the score card
        const user_card = document.createElement("div");
        user_card.classList.add("beatmap-score-top__wrapping-container", "beatmap-score-top__wrapping-container--left");

        //Position element
        const score_position_rank = getUserScoreElementPosition(score, index);
        user_card.appendChild(score_position_rank);

        //Avatar element
        const score_avatar = document.createElement("div");
        score_avatar.classList.add("beatmap-score-top__avatar");

        const score_avatar_link = document.createElement("a");
        score_avatar_link.classList.add("u-hover");
        score_avatar_link.href = `https://osu.ppy.sh/users/${score.user_id}`;
        score_avatar.appendChild(score_avatar_link);

        const score_avatar_link_image = document.createElement("span");
        score_avatar_link_image.classList.add("avatar", "avatar--guest");
        score_avatar_link_image.style.backgroundImage = `url(https://a.ppy.sh/${score.user_id})`;
        //set width+height to 50px
        score_avatar_link_image.style.width = "50px";
        score_avatar_link_image.style.height = "50px";
        score_avatar_link.appendChild(score_avatar_link_image);

        user_card.appendChild(score_avatar);

        //create player element
        const score_player = getUserScoreElementPlayer(score, user, time_ago_long);
        //add user card
        beatmap_score_section.appendChild(user_card);

        const score_card = document.createElement("div");
        score_card.classList.add("beatmap-score-top__wrapping-container", "beatmap-score-top__wrapping-container--right");

        const score_stat_group_score_parent = document.createElement("div");
        score_stat_group_score_parent.classList.add("beatmap-score-top__stats");
        score_stat_group_score_parent.appendChild(getScoreStatElement("Total Score", score.classic_total_score, 'score'));

        const score_stat_group_acc_parent = document.createElement("div");
        score_stat_group_acc_parent.classList.add("beatmap-score-top__stats");
        score_stat_group_acc_parent.appendChild(getScoreStatElement("Accuracy", score.accuracy * 100, score.accuracy == 1 ? 'perfect' : '', (value) => { return formatNumber(value, 2) + "%"; }));
        score_stat_group_acc_parent.appendChild(getScoreStatElement("Max Combo", score.max_combo, score.max_combo == (beatmap.attributes?.max_combo ?? beatmap.max_combo) ? 'perfect' : '', (value) => { return `${value.toLocaleString()}x`; }));

        const score_stat_group_detail_parent = document.createElement("div");
        score_stat_group_detail_parent.classList.add("beatmap-score-top__stats", "beatmap-score-top__stats--wrappable");
        switch (score.ruleset_id) {
            case 0: //osu
                score_stat_group_detail_parent.appendChild(getScoreStatElement("300", score.statistics.great ?? 0, 'smaller'));
                score_stat_group_detail_parent.appendChild(getScoreStatElement("100", score.statistics.ok ?? 0, 'smaller'));
                score_stat_group_detail_parent.appendChild(getScoreStatElement("50", score.statistics.meh ?? 0, 'smaller',));
                score_stat_group_detail_parent.appendChild(getScoreStatElement("Miss", score.statistics.miss ?? 0, 'smaller'));
                break;
            case 1: //taiko
                score_stat_group_detail_parent.appendChild(getScoreStatElement("Great", score.statistics.great ?? 0, 'smaller'));
                score_stat_group_detail_parent.appendChild(getScoreStatElement("Good", score.statistics.ok ?? 0, 'smaller'));
                score_stat_group_detail_parent.appendChild(getScoreStatElement("Miss", score.statistics.miss ?? 0, 'smaller'));
                break;
            case 2: //fruits
                score_stat_group_detail_parent.appendChild(getScoreStatElement("Fruits", score.statistics.great ?? 0, 'smaller'));
                score_stat_group_detail_parent.appendChild(getScoreStatElement("Ticks", score.statistics.large_tick_hit ?? 0, 'smaller'));
                score_stat_group_detail_parent.appendChild(getScoreStatElement("DRP Miss", score.statistics.small_tick_miss ?? 0, 'smaller'));
                score_stat_group_detail_parent.appendChild(getScoreStatElement("Miss", score.statistics.miss ?? 0, 'smaller'));
                break;
            case 3: //mania
                score_stat_group_detail_parent.appendChild(getScoreStatElement("Max", score.statistics.perfect ?? 0, 'smaller'));
                score_stat_group_detail_parent.appendChild(getScoreStatElement("300", score.statistics.great ?? 0, 'smaller'));
                score_stat_group_detail_parent.appendChild(getScoreStatElement("200", score.statistics.good ?? 0, 'smaller'));
                score_stat_group_detail_parent.appendChild(getScoreStatElement("100", score.statistics.ok ?? 0, 'smaller'));
                score_stat_group_detail_parent.appendChild(getScoreStatElement("50", score.statistics.meh ?? 0, 'smaller'));
                score_stat_group_detail_parent.appendChild(getScoreStatElement("Miss", score.statistics.miss ?? 0, 'smaller'));
                break;
        }
        score_stat_group_detail_parent.appendChild(getScoreStatElement("pp", score.pp ? formatNumber(score.pp, 2) : '-', 'smaller'));
        score_stat_group_detail_parent.appendChild(getScoreStatElement("Time", time_ago, 'smaller'));
        score_stat_group_detail_parent.appendChild(getScoreStatElement("Mods", score.mods, 'mods', null, { ruleset: score.ruleset_id }));

        score_card.appendChild(score_stat_group_score_parent);
        score_card.appendChild(score_stat_group_acc_parent);
        score_card.appendChild(score_stat_group_detail_parent);

        user_card.appendChild(score_player);
        beatmap_score_section.appendChild(score_card);

        return score_element;
    }

    function getScoreStatElement(header, value, type = null, formatter = null, data = {}) {
        const element = document.createElement("div");
        element.classList.add("beatmap-score-top__stat");

        const header_element = document.createElement("div");
        header_element.classList.add("beatmap-score-top__stat-header");
        //set padding-bottom to 0px
        header_element.style.paddingBottom = "0px";
        if (type !== 'smaller') {
            header_element.classList.add("beatmap-score-top__stat-header--wider");
        }
        header_element.textContent = header;

        const value_element = document.createElement("div");
        if (type !== 'mods') {
            value_element.textContent = formatter ? formatter(value) : value.toLocaleString();
        } else {
            //only slightly more complex
            let mod_set = MODS_DATA[MODE_SLUGS_ALT[data.ruleset]];
            for (const mod of value?.data) {
                //find the mod_data where Acronym == mod.acronym
                const mod_data = mod_set.find(m => m.Acronym == mod.acronym);
                if (!mod_data) {
                    console.error("Mod data not found", mod.acronym);
                    continue;
                }
                
                const mod_parent_element = document.createElement("div");
                mod_parent_element.classList.add('mod', `mod--type-${mod_data.Type}`);
                
                const mod_element = document.createElement("div");
                mod_element.classList.add("mod__icon", `mod__icon--${mod_data.Acronym}`);
                mod_element.setAttribute("data-acronym", mod_data.Acronym);
                mod_element.setAttribute("data-title", mod_data.Name);
                mod_parent_element.appendChild(mod_element);
                value_element.appendChild(mod_parent_element);
            }
        }
        value_element.classList.add("beatmap-score-top__stat-value", `beatmap-score-top__stat-value${type ? `--${type}` : ""}`);
        //set margin-top to 0px
        value_element.style.marginTop = "0px";

        element.appendChild(header_element);
        element.appendChild(value_element);

        return element;
    }

    function getUserScoreElementPlayer(score, user, time_ago) {
        const user_box = document.createElement("div");
        user_box.classList.add("beatmap-score-top__user-box");

        const user_name_element = document.createElement("a");
        user_name_element.classList.add("js-usercard", "beatmap-score-top__username", "u-hover");
        user_name_element.href = `https://osu.ppy.sh/users/${score.user_id}`;
        user_name_element.target = "_blank";
        user_name_element.rel = "noopener noreferrer";
        user_name_element.setAttribute("data-user-id", score.user_id);
        user_name_element.textContent = user.username;
        user_box.appendChild(user_name_element);

        const date_played_element = document.createElement("div");
        date_played_element.classList.add("beatmap-score-top__achieved", "u-hover");
        date_played_element.textContent = "achieved " + time_ago;
        const date_played_time_element = document.createElement("time");
        date_played_time_element.classList.add("js-timeago");
        date_played_time_element.setAttribute("title", score.date_achieved);
        date_played_time_element.setAttribute("datetime", score.date_achieved);
        date_played_element.appendChild(date_played_time_element);
        user_box.appendChild(date_played_element);

        const flags_container_element = document.createElement("div");
        flags_container_element.classList.add("beatmap-score-top__flags");
        user_box.appendChild(flags_container_element);

        const country_flag_element = document.createElement("a");
        country_flag_element.classList.add("u-hover");
        country_flag_element.href = `https://osu.ppy.sh/rankings/osu/performance?country=${user.country_code}`;
        const country_flag_sub_element = document.createElement("span");
        country_flag_sub_element.classList.add("flag-country", "flag-country--flat");
        country_flag_sub_element.style.backgroundImage = `url(https://osu.ppy.sh/assets/images/flags/${countryCodeToUnicodeHex(user.country_code)}.svg)`;
        country_flag_sub_element.setAttribute("title", user.country.name);
        country_flag_sub_element.setAttribute("data-orig-title", user.country.name);
        country_flag_element.appendChild(country_flag_sub_element);
        flags_container_element.appendChild(country_flag_element);

        if (user.team) {
            const team_flag_element = document.createElement("a");
            team_flag_element.classList.add("u-hover");
            team_flag_element.href = `https://osu.ppy.sh/teams/${user.team.id}`;
            const team_flag_sub_element = document.createElement("span");
            team_flag_sub_element.classList.add("flag-team");
            team_flag_sub_element.style.backgroundImage = `url(${user.team.flag_url})`;
            team_flag_sub_element.setAttribute("title", user.team.name);
            team_flag_sub_element.setAttribute("data-orig-title", user.team.name);
            team_flag_element.appendChild(team_flag_sub_element);
            flags_container_element.appendChild(team_flag_element);
        }

        return user_box;
    }

    function getUserScoreElementPosition(score, index) {
        const score_position = document.createElement("div");
        score_position.classList.add("beatmap-score-top__position-number");
        score_position.textContent = `#${index + 1}`;

        const score_rank = document.createElement("div");
        score_rank.classList.add("score-rank", "score-rank--tiny", `score-rank--${score.rank}`);

        const element = document.createElement("div");
        element.classList.add("beatmap-score-top__position");

        element.appendChild(score_position);
        element.appendChild(score_rank);

        return element;
    }

    async function getUserBeatmapScores(user_id, beatmap_id, ruleset) {
        try {
            const response = await fetch(`${SCORE_INSPECTOR_API}extension/scores/${beatmap_id}/${user_id}/${ruleset}`, {
                method: "GET"
            });

            if (response.status === 200) {
                const data = await response.json();
                let attr_cache = {};
                let _data = data.scores.map(async (score) => {
                    //get the attributes for the score remotely
                    // let attributes = await getBeatmapAttributes(score.beatmap_id, score.ruleset_id, score.mods);
                    let attributes = null;
                    let mod_str = JSON.stringify(score.mods.data);
                    let mod_str_hash = btoa(mod_str);
                    if (attr_cache[mod_str_hash]) {
                        attributes = attr_cache[mod_str_hash];
                    } else {
                        attributes = await getBeatmapAttributes(score.beatmap_id, score.ruleset_id, score.mods);
                        attr_cache[mod_str_hash] = attributes;
                    }
                    return new Score(score, attributes, data.beatmap);
                });
                return {
                    scores: await Promise.all(_data),
                    beatmap: data.beatmap,
                    attributes: data.attributes
                };
            } else {
                console.error("Error fetching beatmap scores", response.status, response.statusText);
                return null;
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function getScoreData() {
        try {
            //find script with id "json-raw"
            const script = document.getElementById("json-show");
            if (!script) {
                console.error("Score data not found");
                return null;
            }

            let score = JSON.parse(script.innerHTML);
            if (!score) {
                console.error("Something went wrong parsing score data");
                return null;
            }

            let attributes = await getBeatmapAttributes(score.beatmap_id, score.ruleset_id, score.mods);

            return new Score(score, attributes);
        } catch (err) {
            console.error(err);
        }
    }

    function countryCodeToUnicodeHex(countryCode) {
        if (countryCode.length !== 2 || !/^[a-zA-Z]+$/.test(countryCode)) {
            throw new Error("Input must be a 2-letter country code (e.g., 'JP', 'US')");
        }

        const c1 = countryCode.toUpperCase().charCodeAt(0);
        const c2 = countryCode.toUpperCase().charCodeAt(1);

        // Regional Indicator A (🇦) starts at 0x1F1E6 (U+1F1E6)
        const hex1 = (0x1F1E6 + c1 - 'A'.charCodeAt(0)).toString(16);
        const hex2 = (0x1F1E6 + c2 - 'A'.charCodeAt(0)).toString(16);

        return `${hex1}-${hex2}`;
    }

    async function runBeatmapPage() {
        if (!window.location.href.includes("/beatmapsets/")) {
            return;
        }

        let last_mode = null;
        let is_running = false;
        const runner = async () => {
            if (is_running) return;
            if (!window.location.href.includes("/beatmapsets/")) {
                is_running = false;
                return;
            }

            await new Promise(r => setTimeout(r, 1000));

            const beatmapset_id = window.location.href.split("/")[4];
            if (!parseInt(beatmapset_id)) {
                console.error("Invalid beatmapset id");
                return;
            }
            const active_beatmap_id = window.location.href.replace(`https://osu.ppy.sh/beatmapsets/${beatmapset_id}/`, "").split("/")[0];

            if (!parseInt(active_beatmap_id)) {
                console.error("Invalid beatmap id");
                return;
            }

            //find the active mode
            let active_mode = window.location.href.split("#")[1]?.split("/")[0];
            if (!active_mode) {
                active_mode = "osu";
            }

            await WaitForElement(".beatmap-basic-stats", 1000);
            await WaitForElement(".beatmap-stats-table", 1000);

            const beatmap_basic_stats = document.getElementsByClassName("beatmap-basic-stats")[0];
            const beatmap_stats_table = document.getElementsByClassName("beatmap-stats-table")[0];

            if (!beatmap_basic_stats || !beatmap_stats_table) {
                console.error("Beatmap basic stats or stats table not found");
                return;
            }

            if (active_mode !== last_mode) {
                removeBeatmapBasicStatsEntry(beatmap_basic_stats, "spinner-count");
                removeBeatmapTableStatsEntry(beatmap_stats_table, "diff-aim");
                removeBeatmapTableStatsEntry(beatmap_stats_table, "diff-speed");
            }
            last_mode = active_mode;

            //get beatmap data
            const beatmap_data = await getBeatmapData(active_beatmap_id, active_mode);

            if (beatmap_data && !Array.isArray(beatmap_data)) {
                const beatmap_set = beatmap_data.beatmapset_data;
                const beatmap = beatmap_data.beatmap_data;
                const attributes = beatmap_data.attributes;

                if (GM_getValue("beatmap_page_show_spinner_count", true)) {
                    addBeatmapBasicStatsEntry(beatmap_basic_stats, IMAGE_ICON_SPINNER, 'spinner-count', "Spinner Count", beatmap.count_spinners);
                }

                if (attributes) {
                    if (active_mode === 'osu') {
                        addBeatmapTableStatsEntry(beatmap_stats_table, 'diff-aim', "Stars Aim", formatNumber(attributes.aim_difficulty, 2), attributes.aim_difficulty * 10);
                        addBeatmapTableStatsEntry(beatmap_stats_table, 'diff-speed', "Stars Speed", formatNumber(attributes.speed_difficulty, 2), attributes.speed_difficulty * 10);
                    }
                }

                // if (GM_getValue("beatmap_page_show_performance_calculator", true)) {
                //     createBeatmapPagePerformanceCalculator(beatmap);
                // }

            } else {
                removeBeatmapBasicStatsEntry(beatmap_basic_stats, "spinner-count");
                removeBeatmapTableStatsEntry(beatmap_stats_table, "diff-aim");
                removeBeatmapTableStatsEntry(beatmap_stats_table, "diff-speed");
            }


            is_running = false;
        }
        runner();

        await new Promise(r => setTimeout(r, 250));
        const beatmapset_beatmap_pickers = document.getElementsByClassName("beatmapset-beatmap-picker__beatmap");
        const mode_pickers = document.getElementsByClassName("game-mode-link");
        //merge the two arrays
        const pickers = [...beatmapset_beatmap_pickers, ...mode_pickers];
        if (pickers && pickers.length > 0) {
            //add onclick event to each element to execute the runner function
            for (const element of pickers) {
                element.addEventListener("click", () => {
                    runner();
                });
            }
        }

    }

    let beatmap_mod_selection_active = new Mods();
    let beatmap_pp_calc_active_ruleset = 'osu';
    async function createBeatmapPagePerformanceCalculator(beatmap) {
        //find element with user-profile-pages user-profile-pages--no-tabs
        beatmap_mod_selection_active = new Mods(); //reset
        beatmap_pp_calc_active_ruleset = beatmap.mode;

        const user_profile_pages = document.getElementsByClassName("user-profile-pages user-profile-pages--no-tabs")[0];

        if (!user_profile_pages) {
            console.error('[inspector] Cannot find main leaderboard container (expects element with class "user-profile-pages user-profile-pages--no-tabs")');
            return;
        }

        //check if pp-calc-container already exists
        if (document.getElementById("pp-calc-container")) {
            document.getElementById("pp-calc-container").remove();
        }

        const pp_calc_container = document.createElement("div");
        pp_calc_container.id = "pp-calc-container";
        pp_calc_container.classList.add("pp-calc-container");

        //insert before user_profile_pages
        const pp_calc_container_parent = user_profile_pages.parentElement;
        pp_calc_container_parent.insertBefore(pp_calc_container, user_profile_pages);

        const pp_calc_page = document.createElement("div");
        pp_calc_page.classList.add("page-extra");
        pp_calc_page.id = "pp-calc-page";

        pp_calc_container.appendChild(pp_calc_page);

        const mods_selector = await createModSelector(beatmap_pp_calc_active_ruleset);
        pp_calc_page.appendChild(mods_selector);

        const pp_calc_main_container = document.createElement("div");
        pp_calc_main_container.classList.add("beatmapset-scoreboard__main");
        pp_calc_main_container.id = "pp-calc-main-container";
        pp_calc_page.appendChild(pp_calc_main_container);

        createOrUpdateBeatmapPagePerformanceModSettingsPanel();
        createBeatmapPagePerformanceStatisticsPanel(beatmap, beatmap_pp_calc_active_ruleset);
    }

    let beatmap_mod_selector_buttons = [];
    async function createModSelector(mode) {
        const container = document.createElement("div");
        container.classList.add("beatmapset-scoreboard__mods", "beatmapset-scoreboard__mods--initial");

        //get mod data
        await modsDataMakeSure();
        const mod_data = MODS_DATA[mode];

        beatmap_mod_selector_buttons = [];
        mod_data.forEach(mod => {
            if (!mod.UserPlayable) return;
            const mod_button = document.createElement("button");
            mod_button.classList.add("beatmap-scoreboard-mod");
            mod_button.type = "button";

            const mod_div = document.createElement("div");
            mod_div.classList.add("mod", `mod--${mod.Acronym}`, `mod--type-${mod.Type}`);
            mod_div.setAttribute("data-acronym", mod.Acronym);
            mod_div.setAttribute("title", mod.Name);
            mod_button.appendChild(mod_div);
            container.appendChild(mod_button);

            beatmap_mod_selector_buttons.push(mod_button);

            mod_button.addEventListener("click", async () => {
                Mods.toggleByAcronym(beatmap_mod_selection_active, mod.Acronym);

                if (Mods.hasMod(beatmap_mod_selection_active, mod.Acronym)) {
                    mod_button.classList.add("beatmap-scoreboard-mod--enabled");
                } else {
                    mod_button.classList.remove("beatmap-scoreboard-mod--enabled");
                }

                //if theres more than 0 mods active, remove "beatmapset-scoreboard__mods--initial", if its 0, add it
                if (beatmap_mod_selection_active.data.length > 0) {
                    container.classList.remove("beatmapset-scoreboard__mods--initial");
                } else {
                    container.classList.add("beatmapset-scoreboard__mods--initial");
                }

                //update compatible mods (disable all buttons that are incompatible with any of the present mods)
                // beatmap_mod_selector_buttons.forEach(button => {
                for await (const button of beatmap_mod_selector_buttons) {
                    const mod = button.firstChild.getAttribute("data-acronym");
                    if (await Mods.isModCompatible(beatmap_mod_selection_active, mode, mod)) {
                        button.classList.remove("beatmap-scoreboard-mod--disabled");
                        button.disabled = false;
                    } else {
                        button.classList.add("beatmap-scoreboard-mod--disabled");
                        button.disabled = true;
                    }
                };

                createOrUpdateBeatmapPagePerformanceModSettingsPanel();
            });
        });

        return container;
    }

    function createBeatmapPagePerformanceStatisticsPanel(beatmap, mode) {
        let container = document.getElementById("pp-calc-main-container");

        let pp_calc_statistics_panel = document.getElementById("pp-calc-statistics-panel");

        if (!pp_calc_statistics_panel) {
            pp_calc_statistics_panel = document.createElement("div");
            pp_calc_statistics_panel.id = "pp-calc-statistics-panel";
            container.appendChild(pp_calc_statistics_panel);
        }

        //clear the container
        pp_calc_statistics_panel.innerHTML = "";

        let pp_calc_statistics_scrollview = document.createElement("div");
        pp_calc_statistics_scrollview.classList.add("mod-settings-container");
        pp_calc_statistics_panel.appendChild(pp_calc_statistics_scrollview);

        //title
        const title = document.createElement("h6");
        title.classList.add("beatmapset-info__title");
        title.textContent = "Statistics";
        pp_calc_statistics_scrollview.appendChild(title);
    }

    async function createOrUpdateBeatmapPagePerformanceModSettingsPanel() {
        let container = document.getElementById("pp-calc-main-container");
        //check if element with id "pp-calc-mod-settings-panel" exists
        let pp_calc_mod_settings_panel = document.getElementById("pp-calc-mod-settings-panel");

        if (!pp_calc_mod_settings_panel) {
            pp_calc_mod_settings_panel = document.createElement("div");
            pp_calc_mod_settings_panel.id = "pp-calc-mod-settings-panel";
            container.appendChild(pp_calc_mod_settings_panel);
        }

        //clear the container
        pp_calc_mod_settings_panel.innerHTML = "";

        let pp_calc_mod_settings_scrollview = document.createElement("div");
        pp_calc_mod_settings_scrollview.classList.add("mod-settings-container");
        pp_calc_mod_settings_panel.appendChild(pp_calc_mod_settings_scrollview);

        //title
        const title = document.createElement("h6");
        title.classList.add("beatmapset-info__title");
        title.textContent = "Mod Settings";
        pp_calc_mod_settings_scrollview.appendChild(title);

        //go through existing mods and create inputs for them
        const mod_data = MODS_DATA[beatmap_pp_calc_active_ruleset];

        if (beatmap_mod_selection_active.data.length > 0) {
            beatmap_mod_selection_active.data.forEach(mod => {
                const data_set = mod_data.find(m => m.Acronym == mod.acronym);

                const mod_settings_container = document.createElement("div");
                mod_settings_container.classList.add("account-edit__input-group");

                //Title (mod icon and name)
                const mod_settings_title = document.createElement("div");
                mod_settings_title.classList.add("mod-icon-label");

                const mod_settings_icon = document.createElement("span");
                mod_settings_icon.classList.add("mod", `mod--${data_set.Acronym}`, `mod--type-${data_set.Type}`);
                mod_settings_icon.setAttribute("data-acronym", data_set.Acronym);
                mod_settings_icon.setAttribute("title", data_set.Name);
                mod_settings_title.appendChild(mod_settings_icon);

                const mod_settings_label = document.createElement("span");
                mod_settings_label.classList.add("mod-icon-label__label");
                mod_settings_label.textContent = data_set.Name;
                mod_settings_title.appendChild(mod_settings_label);

                mod_settings_container.appendChild(mod_settings_title);

                pp_calc_mod_settings_panel.appendChild(mod_settings_container);

                //create input for each setting (if applicable, otherwise a small text saying no settings)
                if (data_set.Settings && data_set.Settings.length > 0) {
                    data_set.Settings.forEach(setting => {
                        const edit_field = getModSettingEditor(mod.acronym, setting, () => {

                        });
                        mod_settings_container.appendChild(edit_field);
                    });
                } else {
                    const no_settings = document.createElement("div");
                    no_settings.classList.add("mod-settings__no-settings");
                    no_settings.textContent = "No settings available";
                    mod_settings_container.appendChild(no_settings);
                }
            });
        }
    }

    function getModSettingEditor(acronym, setting, updateCallback = null) {
        const row = document.createElement("div");
        row.classList.add("account-edit-entry", "js-account-edit");
        row.style.padding = "5px 0px";

        const mod_value = Mods.getModSetting(beatmap_mod_selection_active, acronym, setting.Name);
        let input = null;
        let min = null;
        let max = null;

        if (setting.Name === 'speed_change') {
            min = 0.5;
            max = 2;
        }

        switch (setting.Type) {
            case 'boolean':
                const label = document.createElement("label");
                label.classList.add("account-edit-entry__checkbox");
                row.appendChild(label);

                const switch_label = document.createElement("label");
                switch_label.classList.add("osu-switch-v2");
                label.appendChild(switch_label);

                const switch_input = document.createElement("input");
                switch_input.classList.add("osu-switch-v2__input", "js-account-edit__input");
                switch_input.type = "checkbox";
                switch_input.checked = mod_value;
                switch_label.appendChild(switch_input);

                const switch_styling = document.createElement("span");
                switch_styling.classList.add("osu-switch-v2__content");
                switch_label.appendChild(switch_styling);

                input = switch_input;
                break;
            case 'number':
                const number_input = document.createElement("input");
                number_input.classList.add("account-edit-entry__input", "js-account-edit__input");
                number_input.type = "number";
                number_input.value = mod_value;
                number_input.style.maxWidth = "60px";
                //regex to check if value is a float
                number_input.pattern = "^[0-9]*[.,]?[0-9]*$";
                if (min) number_input.min = min;
                if (max) number_input.max = max;
                input = number_input;
                row.appendChild(number_input);
                break;
            case 'string':
                const string_input = document.createElement("input");
                string_input.classList.add("account-edit-entry__input", "js-account-edit__input");
                string_input.value = mod_value;
                string_input.style.maxWidth = "60px";
                input = string_input;
                row.appendChild(string_input);
                break;
            default:
                const setting_element = document.createElement("div");
                row.appendChild(setting_element);

                const setting_name = document.createElement("span");
                setting_name.classList.add("mod-settings__label");
                setting_name.textContent = setting.Label + ' (no implementation: ' + setting.Type + ')';
                setting_element.appendChild(setting_name);
                break;
        }

        if (input) {
            input.addEventListener("change", () => {
                Mods.setModSetting(beatmap_mod_selection_active, acronym, setting.Name, setting.Type === 'boolean' ? input.checked : input.value);
                console.log(beatmap_mod_selection_active);
            });
        }

        const entry_label = document.createElement("div");
        entry_label.classList.add("account-edit-entry__label");
        entry_label.textContent = setting.Label;
        entry_label.style.fontSize = "10px";
        row.appendChild(entry_label);

        return row;
    }

    function removeBeatmapBasicStatsEntry(beatmap_basic_stats, internal_title) {
        if (beatmap_basic_stats.querySelector(`#beatmap-basic-stats__entry--${internal_title}`)) {
            beatmap_basic_stats.querySelector(`#beatmap-basic-stats__entry--${internal_title}`).remove();
        }
    }

    function removeBeatmapTableStatsEntry(beatmap_stats_table, internal_title) {
        if (beatmap_stats_table.querySelector(`#beatmap-stats-table__entry--${internal_title}`)) {
            beatmap_stats_table.querySelector(`#beatmap-stats-table__entry--${internal_title}`).remove();
        }
    }

    function updateBeatmapBasicStatsEntry(beatmap_basic_stats, internal_title, value) {
        const entry = beatmap_basic_stats.querySelector(`#beatmap-basic-stats__entry--${internal_title}`);
        if (entry) {
            entry.children[1].textContent = value;
            return true;
        } else {
            return false;
        }
    }

    function addBeatmapBasicStatsEntry(beatmap_basic_stats, icon_url, internal_title, title, value) {
        // removeBeatmapBasicStatsEntry(beatmap_basic_stats, internal_title);
        if (updateBeatmapBasicStatsEntry(beatmap_basic_stats, internal_title, value)) return;

        const last_entry = beatmap_basic_stats.children[beatmap_basic_stats.children.length - 1];
        const new_entry = last_entry.cloneNode(true);
        //change "data-orig-title"
        new_entry.setAttribute("title", title);

        //remove data-has-qtip and aria-describedby
        new_entry.removeAttribute("data-has-qtip");
        new_entry.removeAttribute("aria-describedby");
        new_entry.removeAttribute("data-orig-title");
        //give it an unique id
        new_entry.id = `beatmap-basic-stats__entry--${internal_title}`;
        //change child span
        new_entry.children[1].textContent = value;

        new_entry.children[0].style.backgroundImage = `url(${icon_url})`;

        if (!beatmap_basic_stats.querySelector(`#beatmap-basic-stats__entry--spinner-count`)) {
            beatmap_basic_stats.appendChild(new_entry);
        }
    }

    function updateBeatmapTableStatsEntry(beatmap_stats_table, internal_title, value, fill = 0) {
        const entry = beatmap_stats_table.querySelector(`#beatmap-stats-table__entry--${internal_title}`);
        if (entry) {
            entry.querySelector(".beatmap-stats-table__value").textContent = value;
            //get the element with classes "bar bar--beatmap-stats"
            const bar = entry.querySelector(".bar.bar--beatmap-stats");
            //replace the full class with "bar bar--beatmap-stats bar bar--beatmap-stats--${internal_title}"
            bar.className = `bar bar--beatmap-stats bar--beatmap-stats--${internal_title}`;
            //set the style to --fill: ${fill}%
            bar.style.setProperty("--fill", `${Math.min(100, Math.max(0, fill))}%`);
            return true;
        } else {
            return false;
        }
    }

    function addBeatmapTableStatsEntry(beatmap_stats_table, internal_title, title, value, fill = 0) {
        if (updateBeatmapTableStatsEntry(beatmap_stats_table, internal_title, value, fill)) return;

        //get tbody
        const beatmap_stats_table_tbody = beatmap_stats_table.querySelector("tbody");

        const last_entry = beatmap_stats_table_tbody.children[beatmap_stats_table_tbody.children.length - 1];

        const new_entry = last_entry.cloneNode(true);
        //set ID
        new_entry.id = `beatmap-stats-table__entry--${internal_title}`;

        //set content of th with class beatmap-stats-table__label
        new_entry.querySelector(".beatmap-stats-table__label").textContent = title;

        //set content of td with class beatmap-stats-table__value
        new_entry.querySelector(".beatmap-stats-table__value").textContent = value;

        //TODO; set bar value

        //get the element with classes "bar bar--beatmap-stats"
        const bar = new_entry.querySelector(".bar.bar--beatmap-stats");

        //replace the full class with "bar bar--beatmap-stats bar bar--beatmap-stats--${internal_title}"
        bar.className = `bar bar--beatmap-stats bar--beatmap-stats--${internal_title}`;

        //set the style to --fill: ${fill}%
        bar.style.setProperty("--fill", `${Math.min(100, Math.max(0, fill))}%`);

        if (!beatmap_stats_table.querySelector(`#beatmap-stats-table__entry--${internal_title}`)) {
            beatmap_stats_table_tbody.appendChild(new_entry);
        }
    }

    //Add team tags
    let is_tags_working = false;
    async function updateUserTags() {
        // if (is_tags_working) return;
        if (is_tags_working) {
            let attempts = 0;
            while (is_tags_working && attempts < 5) {
                await new Promise(r => setTimeout(r, 1000));
                attempts++;
            }

            if (attempts >= 5) {
                console.warn("User tags are taking too long to update, skipping...");
                return;
            }
        }
        is_tags_working = true;
        await new Promise(r => setTimeout(r, 250));
        try {
            const usercards = document.getElementsByClassName("js-usercard");
            const usercards_big = document.getElementsByClassName("user-card");
            //remove found elements that already have a (nested) child with class "inspector_user_tag"
            const usercards_filtered = Array.from(usercards).filter(card => !card.querySelector(".inspector_user_tag"));
            const usercards_big_filtered = Array.from(usercards_big).filter(card => !card.querySelector(".inspector_user_tag"));

            const user_ids = Array.from(usercards_filtered).map(card => card.getAttribute("data-user-id"));
            const user_ids_big = Array.from(usercards_big_filtered).map(card => getUserCardBigID(card));
            const _user_ids = user_ids.concat(user_ids_big).filter((v, i, a) => a.indexOf(v) === i);

            const teams = await getTeams(_user_ids);

            if (teams && Object.keys(teams).length > 0) {
                modifyJsUserCards(teams);
            }
        } catch (err) {
            console.error(err);
        }
        is_tags_working = false;
    }
    const TAG_TIMEOUT = 5000;
    let update_tag_observer = null;
    let update_tag_observer_list = [
        "beatmapset-scoreboard__main",
        "beatmap-scoreboard-table",
        "beatmap-scoreboard-table__body",
        "beatmap-scoreboard-table__table",
        "osu-layout__col-container",
        "user-list__items",
        "beatmapsets",
        "osuplus-table",
        "qtip--user-card"
    ];

    async function runUsernames() {
        if (!update_tag_observer) {
            update_tag_observer = new MutationObserver((mutationsList, observer) => {
                for (let mutation of mutationsList) {
                    let shouldRun = false;
                    for (const className of update_tag_observer_list) {
                        if (mutation.target.classList.contains(className)) {
                            shouldRun = true;
                            break;
                        }
                    }
                    if (shouldRun) {
                        Promise.race([updateUserTags(), new Promise(r => setTimeout(r, TAG_TIMEOUT))]);
                    }
                }
            });
            update_tag_observer.observe(document.body, { childList: true, subtree: true });
        }
        await updateUserTags();
    }

    function modifyJsUserCards(teams) {
        if (!teams || Object.keys(teams).length === 0) return;

        let usercards = document.querySelectorAll("[class*='js-usercard'], [class*='user-card--card']");
        usercards = Array.from(usercards).filter(card => !card.classList.contains("comment__avatar"));
        usercards = usercards.filter(card => !card.querySelector(".avatar.avatar--guest.avatar--beatmapset"));
        usercards = usercards.filter(card => !card.parentElement.classList.contains("chat-conversation__new-chat-avatar"));
        usercards = usercards.filter(card => !card.parentElement.classList.contains("chat-message-group__sender"));
        usercards = usercards.filter(card => !card.parentElement.classList.contains("beatmap-discussion-user-card__avatar"));
        // usercards = usercards.filter(card => !card.parentElement.classList.contains("js-react--user-card-tooltip"));

        for (let i = 0; i < usercards.length; i++) {
            let user_id = null;
            let team = null;

            if (usercards[i].classList.contains("user-card--card")) {
                user_id = getUserCardBigID(usercards[i]);
                if (!user_id) continue;

                team = teams[user_id];
                if (!team) continue;

                setBigUserCardTeamTag(usercards[i], team.team);
                continue;
            }

            user_id = usercards[i].getAttribute("data-user-id");
            if (!user_id) continue;
            team = teams[user_id];

            if (!team) continue;

            setUserCardBrickTeamTag(usercards[i], team.team);
        }
    }

    function setBigUserCardTeamTag(card, team) {
        const usernameElement = card.getElementsByClassName("user-card__username u-ellipsis-pre-overflow")[0];

        if (usernameElement.getElementsByClassName("inspector_user_tag").length > 0) {
            return;
        }
        const teamTag = generateTagSpan(team);
        usernameElement.insertBefore(teamTag, usernameElement.childNodes[0]);
    }

    function setUserCardBrickTeamTag(card, team) {
        let username = card.textContent;
        username = username.trim();
        const teamTag = generateTagSpan(team);


        if (card.classList.contains("beatmap-scoreboard-table__cell-content") ||
            card.classList.contains("beatmap-discussion-user-card__user-link")) {
            teamTag.style.paddingRight = "4px";
        }

        const usercardLink = card.getElementsByClassName("user-card-brick__link")[0];

        if (usercardLink) {
            if (usercardLink.getElementsByClassName("inspector_user_tag").length > 0) {
                return;
            }

            teamTag.style.marginRight = "5px";
            usercardLink.insertBefore(teamTag, usercardLink.childNodes[1]);
        } else if (card.classList.contains("ranking-page-table-main__link")) {
            //we insert the tag inside the name span, otherwise spacing is off
            const nameSpan = card.getElementsByClassName("ranking-page-table-main__link-text")[0];
            if (nameSpan.getElementsByClassName("inspector_user_tag").length > 0) {
                return;
            }
            nameSpan.insertBefore(teamTag, nameSpan.childNodes[0]);
        } else {
            if (card.getElementsByClassName("inspector_user_tag").length > 0) {
                return;
            }
            let index = 0;
            //if parent has class "team-members-leaderboard-item__username", index = 1
            if (card.classList.contains("team-members-leaderboard-item__username")) {
                index = 2;
            }

            //if theres a child element of card with class "forum-user-icon", index = 1
            // const userIcon = card.getElementsByClassName("forum-user-icon")[0];
            if (card.getElementsByClassName("forum-user-icon").length > 0) {
                index = 1;
            }

            card.insertBefore(teamTag, card.childNodes[index]);
        }
    }

    const generateTagSpan = (team) => {
        const teamTag = document.createElement("a");
        teamTag.textContent = `[${team.short_name}] `;
        teamTag.style.color = `${team.color}`;
        teamTag.style.fontWeight = "bold";
        teamTag.href = `https://osu.ppy.sh/teams/${team.id}`;
        teamTag.target = "_blank";
        teamTag.style.whiteSpace = "nowrap";
        teamTag.classList.add("inspector_user_tag");
        return teamTag;
    }

    function getUserCardBigID(card) {
        const container = card.querySelector("a");
        if (!container) return null;
        const href_split = container.href.split("/");
        if (href_split.length < 2) return null;
        const user_id = href_split[href_split.length - 1];
        if (!parseInt(user_id)) {
            console.error("Invalid user id", user_id);
            return null;
        }
        return user_id;
    }

    const USER_TEAM_CACHE = {};
    const SKIP_USER_TEAM_FETCH = []; //these don't have teams, so we skip them for this session
    async function getTeams(user_id_array) {
        if (!user_id_array || user_id_array.length === 0) {
            return null;
        }

        //remove users that are in the SKIP_USER_TEAM_FETCH array
        user_id_array = user_id_array.filter(user_id => !SKIP_USER_TEAM_FETCH.includes(user_id));

        let team_map = {};

        //check if we have the data in cache
        user_id_array.forEach(user_id => {
            if (USER_TEAM_CACHE[user_id]) {
                team_map[user_id] = USER_TEAM_CACHE[user_id];
            }
        });

        //filter out the user_ids that are already in the cache
        user_id_array = user_id_array.filter(user_id => !USER_TEAM_CACHE[user_id]);

        if (user_id_array.length === 0) {
            return team_map;
        }

        const teams = await fetch(`${SCORE_INSPECTOR_API}extension/users/teams`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GM_getValue("access_token")}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ids: user_id_array
            })
        }).then(res => res.json()).catch(err => {
            console.error(err);
            return null;
        });

        if (teams && Array.isArray(teams) && teams.length > 0) {
            teams.forEach(team => {
                team_map[team.user_id] = team;
                USER_TEAM_CACHE[team.user_id] = team;
            });

            //check if we have any users that don't have teams
            //remove users that don't have teams from the user_id_array
            const no_team_users = user_id_array.filter(user_id => !teams.find(team => team.user_id == user_id));
            if (no_team_users.length > 0) {
                no_team_users.forEach(user_id => {
                    SKIP_USER_TEAM_FETCH.push(user_id);
                });
            }
        }


        return team_map;
    }

    function createPagination(page, country, base_url, max_rank_page = 200) {
        const nav = document.createElement("nav");
        nav.classList.add("pagination-v2");

        const nav_prev_col = document.createElement("div");
        nav_prev_col.classList.add("pagination-v2__col");

        let nav_prev_span = null;
        if (page === 1) {
            nav_prev_span = document.createElement("span");
            nav_prev_span.classList.add("pagination-v2__link", "pagination-v2__link--quick", "pagination-v2__link--disabled");
        } else {
            nav_prev_span = document.createElement("a");
            nav_prev_span.classList.add("pagination-v2__link", "pagination-v2__link--quick");
            // nav_prev_span.href = `/rankings/osu/ss?page=${page - 1}`;
            nav_prev_span.href = `${base_url}?page=${page - 1}&country=${country}`;
        }
        const nav_prev_span_icon = document.createElement("i");
        nav_prev_span_icon.classList.add("fas", "fa-angle-left");
        nav_prev_span.appendChild(nav_prev_span_icon);
        nav_prev_span.appendChild(document.createTextNode(" "));
        const nav_prev_span_text = document.createElement("span");
        nav_prev_span_text.textContent = "PREV";
        nav_prev_span.appendChild(nav_prev_span_text);
        nav_prev_col.appendChild(nav_prev_span);
        nav.appendChild(nav_prev_col);

        const nav_next_col = document.createElement("div");
        nav_next_col.classList.add("pagination-v2__col");

        const BUTTONS_BEFORE_CURRENT_PAGE = 2;
        const BUTTONS_AFTER_CURRENT_PAGE = 2;

        //1 and 200 are always shown
        const _createPageButton = (_page, active = false) => {
            const li = document.createElement("li");
            li.classList.add("pagination-v2__item");

            let a = null;
            if (_page === page) {
                a = document.createElement("span");
            } else {
                a = document.createElement("a");
            }
            a.classList.add("pagination-v2__link");
            // a.href = `/rankings/osu/ss?page=${_page}`;
            a.href = `${base_url}?page=${_page}&country=${country}`;
            if (active) {
                a.classList.add("pagination-v2__link--active");
            }
            a.textContent = _page;

            li.appendChild(a);

            return li;
        }

        const pagination_items = document.createElement("div");
        pagination_items.classList.add("pagination-v2__col", "pagination-v2__col--pages");
        nav.appendChild(pagination_items);

        //just loop between 1 and 200
        for (let i = 1; i <= max_rank_page; i++) {
            if (i === 1 || i === max_rank_page || (i >= page - BUTTONS_BEFORE_CURRENT_PAGE && i <= page + BUTTONS_AFTER_CURRENT_PAGE)) {
                pagination_items.appendChild(_createPageButton(i, i === page));
            } else if (i === page - BUTTONS_BEFORE_CURRENT_PAGE - 1 || i === page + BUTTONS_AFTER_CURRENT_PAGE + 1) {
                const li = document.createElement("li");
                li.classList.add("pagination-v2__item");
                li.textContent = "...";
                pagination_items.appendChild(li);
            }
        }

        let nav_next_span = null;
        if (page === max_rank_page) {
            nav_next_span = document.createElement("span");
            nav_next_span.classList.add("pagination-v2__link", "pagination-v2__link--quick", "pagination-v2__link--disabled");
        } else {
            nav_next_span = document.createElement("a");
            nav_next_span.classList.add("pagination-v2__link", "pagination-v2__link--quick");
            // nav_next_span.href = `/rankings/osu/ss?page=${page + 1}`;
            nav_next_span.href = `${base_url}?page=${page + 1}&country=${country}`;
        }
        const nav_next_span_icon = document.createElement("i");
        const nav_next_span_text = document.createElement("span");
        nav_next_span_text.textContent = "NEXT";
        nav_next_span.appendChild(nav_next_span_text);
        nav_next_span.appendChild(document.createTextNode(" "));
        nav_next_span_icon.classList.add("fas", "fa-angle-right");
        nav_next_span.appendChild(nav_next_span_icon);
        nav_next_col.appendChild(nav_next_span);
        nav.appendChild(nav_next_col);

        return nav;
    }

    function createRankingFilter(active_country = 'all') {
        const filter_container = document.createElement("div");
        filter_container.classList.add("osu-page", "osu-page--ranking-info");

        const filter_grid = document.createElement("div");
        filter_grid.classList.add("grid-items", "grid-items--ranking-filter");
        filter_container.appendChild(filter_grid);

        const country_filter = document.createElement("div");
        country_filter.classList.add("js-react--ranking-country-filter", "u-contents");
        filter_grid.appendChild(country_filter);

        const country_filter_full = document.createElement("div");
        country_filter_full.classList.add("ranking-filter", "ranking-filter--full");
        country_filter.appendChild(country_filter_full);

        const country_filter_label = document.createElement("div");
        country_filter_label.classList.add("ranking-filter__title");
        country_filter_label.textContent = "Country";
        country_filter_full.appendChild(country_filter_label);

        const country_select_parent = document.createElement("div");
        country_select_parent.classList.add("select-options", "select-options--ranking");
        country_filter_full.appendChild(country_select_parent);

        //contains current selected country
        const country_select = document.createElement("div");
        country_select.classList.add("select-options__select");
        country_select_parent.appendChild(country_select);

        //contains all the countries
        const country_selector = document.createElement("div");
        country_selector.classList.add("select-options__selector");
        country_select_parent.appendChild(country_selector);

        country_select.addEventListener("click", function (event) {
            event.preventDefault();
            country_select_parent.classList.toggle("select-options--selecting");
        });

        //test country
        if (!active_country || active_country === "all") {
            country_select.appendChild(getCountryDropdownItem("all", 'All', false, true));
        } else {
            const country = COUNTRY_DATA.find(c => c.acronym === active_country);
            country_select.appendChild(getCountryDropdownItem(country.acronym, country.name, false, true));
        }

        country_selector.appendChild(getCountryDropdownItem('all', 'All', false, false));
        // COUNTRY_DATA.forEach(country => {
        for (const country of COUNTRY_DATA) {
            if (country.display == 0 || country.acronym == "XX") continue;
            country_selector.appendChild(getCountryDropdownItem(country.acronym, country.name, country.acronym == active_country));
        };

        return filter_container;
    }

    function getCountryDropdownItem(acronym, label, selected = false, add_decoration = false) {
        const a = document.createElement("a");
        a.classList.add("select-options__option");
        if (selected) {
            a.classList.add("select-options__option--selected");
        }
        // a.href = `https://osu.ppy.sh/rankings/osu/performance?country=${country}`;
        //get current url without query string
        const url = window.location.href.split("?")[0];
        if (acronym === "all") {
            a.href = `${url}`;
        } else {
            a.href = `${url}?country=${acronym}`;
        }

        const label_div = document.createElement("div");
        label_div.classList.add("u-ellipsis-overflow");
        label_div.textContent = label;
        a.appendChild(label_div);

        if (add_decoration) {
            const decorator_parent = document.createElement("div");
            decorator_parent.classList.add("select-options__decoration");

            const decorator = document.createElement("span");
            decorator.classList.add("fas", "fa-chevron-down");
            decorator_parent.appendChild(decorator);

            a.appendChild(decorator_parent);
        }

        return a;
    }

    function createRankingNavigation(data) {
        data.nav.innerHTML = "";
        data.items.forEach(item => {
            if (!data.nav.querySelector(`[data-content="${item.attr}"]`)) {
                const li = document.createElement("li");
                li.classList.add("header-nav-v4__item");
                data.nav.appendChild(li);

                const a = document.createElement("a");
                a.classList.add("header-nav-v4__link");
                a.href = `https://osu.ppy.sh${item.link.replace("/.*", item.default_linker ? `/${item.default_linker}` : "").replace("{mode}", data.mode)}`;
                a.textContent = item.name;
                a.setAttribute("data-content", item.attr);
                li.appendChild(a);

                let is_active = false;

                if (data.active && item.attr.toLowerCase() === data.active.toLowerCase()){
                    is_active = true;
                }

                if(is_active){
                    a.classList.add("header-nav-v4__link--active");
                }
            }
        });
    }

    function createTableHeaderItem(text = '', is_focus = false, is_grade = false) {
        const th = document.createElement("th");
        th.textContent = text;
        th.classList.add("ranking-page-table__heading");
        if (is_grade) {
            th.classList.add("ranking-page-table__heading--grade");
        }
        if (is_focus) {
            th.classList.add("ranking-page-table__heading--focused");
        }
        return th;
    }

    async function handleLeaderboardPage() {
        //find ul with class "header-nav-v4 header-nav-v4--list"
        let headerNav = document.getElementsByClassName("header-nav-v4 header-nav-v4--list")[0];

        //check if we are on any of the rankings pages in CUSTOM_RANKINGS
        //remove the query string from the url
        let url = window.location.href.split("?")[0];
        //remove the domain from the url
        url = url.replace("https://osu.ppy.sh", "");

        let mode = 'osu';
        let ranking = null;
        let is_global = url.includes("/global");
        // /rankings/osu/...
        let mode_index = 2;
        let ranking_index = is_global ? 4 : 3;
        // /rankings/taiko/... we need to get the mode from the url
        if (url.includes("/rankings/")) {
            mode = url.split("/")[mode_index];
            if (!MODE_SLUGS_ALT.includes(mode)) {
                mode = 'osu';
                ranking_index = mode_index;
            }

        } else if (url.includes("/multiplayer/rooms/")) {
            ranking_index = 1;
        } else if (url.includes("/seasons/")) {
            ranking_index = 1;
        }
        ranking = url.split("/")[ranking_index];

        const active_custom_ranking = CUSTOM_RANKINGS.find(ranking => ranking.path === url);
        // const active_custom_ranking = lb_page_nav_items.find(item => item.link === url);
        if (active_custom_ranking) {
            //set body style to "--base-hue-default: 115; --base-hue-override: 115"
            document.body.style.setProperty("--base-hue-default", 115);
            document.body.style.setProperty("--base-hue-override", 115);

            //get page from url query
            let page = new URLSearchParams(window.location.search).get("page") ?? 1;
            page = Number(page) || 1;

            let country = new URLSearchParams(window.location.search).get("country") ?? null;

            if (country && country !== "all") {
                country = country.toUpperCase();
                //check if country is valid
                if (!COUNTRY_DATA.find(c => c.acronym === country)) {
                    country = null;
                }
            }

            // const container = await runCleanErrorPage(active_custom_ranking.name, "rankings");
            const page_data = await runCleanErrorPage(active_custom_ranking.name, "rankings", {
                title: "rankings"
            });

            const container = page_data.container;
            headerNav = page_data.header_nav;

            const filter_container = createRankingFilter(country);
            container.appendChild(filter_container);

            const scores_container = document.createElement("div");
            scores_container.classList.add("osu-page", "osu-page--generic");
            scores_container.id = "scores";
            container.appendChild(scores_container);


            //first try to get data now
            const fetch_url = `${SCORE_INSPECTOR_API}extension/rank/${active_custom_ranking.api_path}/${page}/${country ?? ""}`;
            const response = await fetch(fetch_url, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                }
            });

            let data = null;
            let total_pages = null;
            try {
                if (response.status !== 200) {
                    throw new Error("An error occurred while fetching the data. Please try again later.");
                }
                data = await response.json();
                total_pages = Number(response.headers.get("X-Total-Pages") ?? 200);
            } catch (e) {
                scores_container.innerHTML = "An error occurred while fetching the data. Please try again later.";
                return;
            }

            scores_container.appendChild(createPagination(page, country, `/rankings/osu/${active_custom_ranking.api_path}`, total_pages));

            const ranking_page = document.createElement("div");
            ranking_page.classList.add("ranking-page");
            scores_container.appendChild(ranking_page);

            const ranking_table = document.createElement("table");
            ranking_table.classList.add("ranking-page-table");
            ranking_page.appendChild(ranking_table);

            const ranking_thead = document.createElement("thead");
            ranking_table.appendChild(ranking_thead);

            ranking_thead.appendChild(createTableHeaderItem());
            if (GM_getValue("leaderboards_seperate_flags_column", true)) { ranking_thead.appendChild(createTableHeaderItem()); }
            ranking_thead.appendChild(createTableHeaderItem());

            for (let attr of active_custom_ranking.attributes) {
                ranking_thead.appendChild(createTableHeaderItem(attr[0].name, attr[1] ?? false));
            }

            const ranking_tbody = document.createElement("tbody");
            ranking_table.appendChild(ranking_tbody);

            const _addTableBodyRow = (data, i) => {
                const tr = document.createElement("tr");
                tr.classList.add("ranking-page-table__row");

                const td_rank = document.createElement("td");
                td_rank.classList.add("ranking-page-table__column", "ranking-page-table__rank");
                td_rank.textContent = `#${i + 1 + (page - 1) * 50}`;
                tr.appendChild(td_rank);

                let td_flags = null;
                if (GM_getValue("leaderboards_seperate_flags_column", true)) {
                    td_flags = document.createElement("td");
                    td_flags.classList.add("ranking-page-table__column", "ranking-page-table__column--flag");
                    tr.appendChild(td_flags);
                }

                const td_user = document.createElement("td");
                td_user.classList.add("ranking-page-table__column", "ranking-page-table__column--main");
                tr.appendChild(td_user);


                const td_user_container = document.createElement("div");
                td_user_container.classList.add("ranking-page-table-main");
                td_user.appendChild(td_user_container);

                const td_user_flag = document.createElement("div");
                td_user_flag.classList.add("ranking-page-table-main__flag");
                // td_user_container.appendChild(td_user_flag);
                if (td_flags) {
                    const td_flags_container = document.createElement("div");
                    td_flags_container.classList.add("ranking-page-table-main");
                    td_flags_container.appendChild(td_user_flag);
                    td_flags.appendChild(td_flags_container);
                } else {
                    td_user_container.appendChild(td_user_flag);
                }

                const td_user_flag_contents = document.createElement("div");
                td_user_flag_contents.classList.add("u-contents");
                td_user_flag.appendChild(td_user_flag_contents);

                const td_user_country_flag_element = document.createElement("a");
                td_user_country_flag_element.classList.add("flag-country");
                td_user_country_flag_element.style.backgroundImage = `url(https://flagpedia.net/data/flags/h24/${data.country_code.toLowerCase()}.webp)`;
                td_user_country_flag_element.setAttribute("title", data.country_name);
                td_user_country_flag_element.href = `/rankings/osu/${active_custom_ranking.api_path}?country=${data.country_code}`;
                td_user_flag_contents.appendChild(td_user_country_flag_element);
                if (!GM_getValue("leaderboards_show_country_flags", true)) {
                    td_user_country_flag_element.style.display = "none";
                }

                if (data.team) {
                    const td_user_team_flag_element = document.createElement("a");
                    td_user_team_flag_element.classList.add("flag-team");
                    td_user_team_flag_element.style.backgroundImage = `url(${data.team.flag_url})`;
                    td_user_team_flag_element.setAttribute("title", data.team.name);
                    td_user_team_flag_element.href = `https://osu.ppy.sh/teams/${data.team.id}`;
                    td_user_flag_contents.appendChild(td_user_team_flag_element);
                    if (!GM_getValue("leaderboards_show_team_flags", true)) {
                        td_user_team_flag_element.style.display = "none";
                    }
                }

                const td_user_card = document.createElement("a");
                td_user_card.classList.add("ranking-page-table-main__link", "js-usercard");
                td_user_card.href = `/users/${data.user_id}`;
                td_user_card.setAttribute("data-user-id", data.user_id);
                td_user_card.setAttribute("data-tooltip-position", "right center");
                td_user_container.appendChild(td_user_card);


                if (GM_getValue("leaderboards_show_avatars", true)) {
                    const td_user_icon_container = document.createElement("span");
                    td_user_icon_container.classList.add("ranking-page-table-main__flag");
                    td_user_card.appendChild(td_user_icon_container);

                    const td_user_icon_element = document.createElement("span");
                    td_user_icon_element.classList.add("avatar", "avatar--dynamic-size");
                    td_user_icon_element.style.backgroundImage = `url(https://a.ppy.sh/${data.user_id})`;
                    td_user_icon_container.appendChild(td_user_icon_element);
                }

                const td_user_name_element = document.createElement("span");
                td_user_name_element.classList.add("ranking-page-table-main__link-text");
                td_user_name_element.textContent = data.username;
                td_user_card.appendChild(td_user_name_element);

                for (let attr of active_custom_ranking.attributes) {
                    const formatter = attr[0].formatter ?? ((val) => val.toLocaleString());
                    const td = document.createElement("td");
                    td.classList.add("ranking-page-table__column");
                    if (!attr[1]) {
                        td.classList.add("ranking-page-table__column--dimmed");
                    }
                    td.textContent = formatter(attr[0].val(data));
                    if (attr[0].tooltip_formatter) {
                        td.setAttribute("data-html-title", attr[0].tooltip_formatter(Number(attr[0].val(data) ?? 0)));
                        td.setAttribute("title", "");
                    }
                    tr.appendChild(td);
                }

                return tr;
            }

            data.forEach((d, i) => {
                ranking_tbody.appendChild(_addTableBodyRow(d, i));
            });

            //another pagination at the bottom
            scores_container.appendChild(createPagination(page, country, `/rankings/osu/${active_custom_ranking.api_path}`, total_pages));

            // find 'a' with data-menu-target = "nav2-menu-popup-rankings"
            let nav2_menu_link_bar = document.querySelector('a[data-menu-target="nav2-menu-popup-rankings"]');
            //get child span
            let nav2_menu_link_bar_span = nav2_menu_link_bar.querySelector("span");

            //add a span with class "nav2__menu-link-bar u-section--bg-normal"
            let nav2_menu_link_bar_span_new = document.createElement("span");
            nav2_menu_link_bar_span_new.classList.add("nav2__menu-link-bar", "u-section--bg-normal");
            nav2_menu_link_bar_span.appendChild(nav2_menu_link_bar_span_new);
        } else {
            const valid_rankings = ["performance", "score", "rooms", "daily-challenge", "seasons", "charts", "kudosu"];
            if (GM_getValue("leaderboards_seperate_flags_column", true) && valid_rankings.includes(ranking)) {
                const LEADERBOARD_STRUCTURE = OFFICIAL_LEADERBOARD_STRUCTURES[ranking]();

                const FLAGS_INDEX = LEADERBOARD_STRUCTURE.indexOf("flags");
                const USER_INDEX = LEADERBOARD_STRUCTURE.indexOf("user");

                //get thead
                const table = document.getElementsByClassName("ranking-page-table")[0];
                const thead = table.getElementsByTagName("thead")[0];
                const thead_tr = thead.getElementsByTagName("tr")[0];
                const tbody = table.getElementsByTagName("tbody")[0];

                //after the first element in tbody
                thead_tr.insertBefore(createTableHeaderItem(), thead_tr.children[FLAGS_INDEX]);

                //go through each row
                const rows = tbody.getElementsByTagName("tr");
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    //for now, just add a blank td
                    const td_flags = document.createElement("td");
                    td_flags.classList.add("ranking-page-table__column", "ranking-page-table__column--flag");
                    row.insertBefore(td_flags, row.children[FLAGS_INDEX]);

                    //create element ranking-page-table-main
                    const td_user_flag = document.createElement("div");
                    td_user_flag.classList.add("ranking-page-table-main");
                    td_flags.appendChild(td_user_flag);

                    const td_user_flag_contents = document.createElement("div");
                    td_user_flag_contents.classList.add("u-contents");
                    td_user_flag.appendChild(td_user_flag_contents);

                    //find all elements with class ranking-page-table-main__flag in the user column, and move them to the new td
                    const user_td = row.children[USER_INDEX];
                    const user_td_children = user_td.getElementsByClassName("ranking-page-table-main__flag");
                    // append them all to td_user_flag_contents
                    for (let j = 0; j < user_td_children.length; j++) {
                        td_user_flag_contents.appendChild(user_td_children[j].cloneNode(true)); //for some reason if we don't clone, it doesn't work properly
                    }

                    //remove the original elements from the user column
                    while (user_td_children.length > 0) {
                        user_td_children[0].remove();
                    }
                }
            }

            if (GM_getValue("leaderboards_show_avatars", true) && valid_rankings.includes(ranking)) {
                const LEADERBOARD_STRUCTURE = OFFICIAL_LEADERBOARD_STRUCTURES[ranking]();
                const USER_INDEX = LEADERBOARD_STRUCTURE.indexOf("user");

                const table = document.getElementsByClassName("ranking-page-table")[0];
                const thead = table.getElementsByTagName("thead")[0];
                const thead_tr = thead.getElementsByTagName("tr")[0];
                const tbody = table.getElementsByTagName("tbody")[0];

                const rows = tbody.getElementsByTagName("tr");
                for (let i = 0; i < rows.length; i++) {
                    const td_user = rows[i].children[USER_INDEX];
                    const user_card = td_user.getElementsByClassName("js-usercard")[0];
                    const user_id = user_card.getAttribute("data-user-id");

                    const td_user_container = td_user.children[0];

                    const td_user_icon_container = document.createElement("span");
                    td_user_icon_container.classList.add("ranking-page-table-main__flag");
                    // td_user_container.appendChild(td_user_icon_container);
                    //at front
                    user_card.insertBefore(td_user_icon_container, user_card.children[0]);

                    const td_user_icon_element = document.createElement("span");
                    td_user_icon_element.classList.add("avatar", "avatar--dynamic-size");
                    td_user_icon_element.style.backgroundImage = `url(https://a.ppy.sh/${user_id})`;
                    td_user_icon_container.appendChild(td_user_icon_element);
                }

            }

            if (!GM_getValue("leaderboards_show_country_flags", true)) {
                const country_flags = document.getElementsByClassName("flag-country");
                for (let i = 0; i < country_flags.length; i++) {
                    let element = country_flags[i].closest(".ranking-page-table-main__flag");
                    if (element?.classList.contains("ranking-page-table-main__flag")) {
                        element.style.display = "none";
                    }
                }
            }

            if (!GM_getValue("leaderboards_show_team_flags", true)) {
                const team_flags = document.getElementsByClassName("flag-team");
                for (let i = 0; i < team_flags.length; i++) {
                    let element = team_flags[i].closest(".ranking-page-table-main__flag");
                    if (element?.classList.contains("ranking-page-table-main__flag")) {
                        element.style.display = "none";
                    }
                }
            }
        }

        // const active_ranking = lb_page_nav_items.find(item => item.link.replace("{mode}", mode) === url);
        const active_ranking = lb_page_nav_items.find(item => {
            //some links may have "/*" at the end, in that case, we need to check if the url starts with the link instead of checking for equality
            if (item.link.includes("/.*")) {
                return url.startsWith(item.link.replace("{mode}", mode).replace("/.*", ""));
            }

            return item.link.replace("{mode}", mode) === url;
        });
        //empty the header nav
        createRankingNavigation({
            nav: headerNav,
            items: lb_page_nav_items,
            mode: mode,
            // active: active_custom_ranking ? active_custom_ranking.api_path : null
            active: active_ranking ? active_ranking.attr : null
        });

        //if we are on daily-challenge page
        if (window.location.href.includes("/rankings/daily-challenge")) {
            //wait 0.5s for the page to load
            await new Promise(r => setTimeout(r, 1000));
            //we need to patch out issue from subdivide nations extension
            //get all elements with class "ranking-page-table__user-link" under "ranking-page-table"
            const userLinks = document.getElementsByClassName("ranking-page-table__user-link");

            //loop through all userLinks
            for (let i = 0; i < userLinks.length; i++) {
                //check if we have 2 divs with style "display: inline-block"
                //if we do, this row is affected by subdivide nations extension

                //if we have 2 divs with style "display: inline-block"
                if (userLinks[i].children[0].style.display === "inline-block" && userLinks[i].children[1].style.display === "inline-block") {
                    //move the first span of the second div to the first div as 2nd child
                    userLinks[i].children[0].appendChild(userLinks[i].children[1].children[0]);

                    //move 2nd child of first div, to the back of the first div
                    userLinks[i].children[0].appendChild(userLinks[i].children[0].children[1]);

                    //remove the second div
                    userLinks[i].removeChild(userLinks[i].children[1]);

                    //move all children of the first div to the parent div and remove the first div
                    while (userLinks[i].children[0].children.length > 0) {
                        userLinks[i].appendChild(userLinks[i].children[0].children[0]);
                    }

                    userLinks[i].removeChild(userLinks[i].children[0]);
                }
            }
            //else if we are on "/rankings/{mode}/team" page, mode can be any string, we don't care
        } else if (window.location.href.includes("/rankings/") && window.location.href.includes("/team")) {
            //get element with class "sort__items"
            const sort_items = document.getElementsByClassName("sort__items")[0];

            //add a new item which redirects to our custom team rankings website
            const sort_item_redirect = document.createElement("a");
            sort_item_redirect.classList.add("sort__item", "sort__item--button");
            sort_item_redirect.href = `https://kirino.sh/teams/`;
            sort_item_redirect.target = "_blank";
            sort_item_redirect.textContent = "More Leaderboards";

            sort_items.appendChild(sort_item_redirect);
        }
    }

    const DISALLOWED_FILTERS = ["friends", "country", "variant"];
    async function runScoreRankChanges() {
        //url has to match: "/rankings/{mode}/score{?page=1}"
        const _url = window.location.href;
        const mode = _url.match(/\/rankings\/(osu|taiko|fruits|mania)\/global\/score/)?.[1];
        if (!mode) {
            return;
        }

        const url = new URL(_url);
        const params = url.searchParams;
        for (const param of params.keys()) {
            let value = params.get(param);
            if (DISALLOWED_FILTERS.includes(param) && value !== "all") {
                return;
            }
        }

        const mode_id = MODE_SLUGS_ALT.indexOf(mode);
        if (mode_id === -1) {
            return;
        }

        await WaitForElement('.ranking-page-table');

        const table = document.getElementsByClassName('ranking-page-table')[0];
        const thead = table.getElementsByTagName('thead')[0];
        const tbody = table.getElementsByTagName('tbody')[0];
        const rows = tbody.getElementsByTagName('tr');
        const headerRow = thead.getElementsByTagName('tr')[0];

        const headerCells = headerRow.getElementsByTagName('th');

        let LEADERBOARD_STRUCTURE = OFFICIAL_LEADERBOARD_STRUCTURES.score();

        const RANK_INDEX = LEADERBOARD_STRUCTURE.indexOf("pos");
        const USER_INDEX = LEADERBOARD_STRUCTURE.indexOf("user");
        const RANK_CHANGE_INDEX = RANK_INDEX + 1;
        const SCORE_INDEX = LEADERBOARD_STRUCTURE.indexOf("ranked_score");
        const SCORE_CHANGE_OFFSET = 2;
        const SCORE_CHANGE_INDEX = SCORE_INDEX + 1 + SCORE_CHANGE_OFFSET;

        let rank_change_date = null;

        //change all rows to completion percentage (first do a dash, then do the percentage when the data is loaded)
        let ids = [];
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.getElementsByTagName('td');

            //get the user id from the data-user-id attribute
            //from column 1, get the the first child element with class 'js-usercard' in it, then get the data-user-id attribute
            const user_id = cells[USER_INDEX].getElementsByClassName('js-usercard')[0].getAttribute('data-user-id');
            ids.push(user_id);
        }

        //get data
        //post with user_ids
        const result = await fetch(`${SCORE_INSPECTOR_API}extension/score_rank_history/${mode_id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ids: ids })
        });

        const data = await result.json();

        if (!data || data.error) {
            console.error(data.error);
            return;
        }

        const getRankChangeIcon = (change) => {
            const td = document.createElement('td');

            //ranking-page-table__column ranking-page-table__column--rank-change-icon ranking-page-table__column--rank-change-none
            //ranking-page-table__column ranking-page-table__column--rank-change ranking-page-table__column--rank-change-up
            td.classList.add('ranking-page-table__column', 'ranking-page-table__column--rank-change');
            if (change === 0) {
                td.classList.add('ranking-page-table__column--rank-change-none');
            } else if (change > 0) {
                td.classList.add('ranking-page-table__column--rank-change-up');
            } else {
                td.classList.add('ranking-page-table__column--rank-change-down');
            }

            return td;
        }

        const getRankChangeText = (change, format = false) => {
            const td = document.createElement('td');

            //ranking-page-table__column ranking-page-table__column--rank-change-value ranking-page-table__column--rank-change-none
            td.classList.add('ranking-page-table__column', 'ranking-page-table__column--rank-change-value');

            if (change === 0) {
                td.classList.add('ranking-page-table__column--rank-change-none');
            } else if (change > 0) {
                td.classList.add('ranking-page-table__column--rank-change-up');
            } else {
                td.classList.add('ranking-page-table__column--rank-change-down');
            }

            if (change !== 0) {
                if (format) {
                    td.textContent = formatNumberAsSize(change);
                    td.title = change.toLocaleString();
                } else {
                    td.textContent = Math.abs(change);
                }
            }

            return td;
        }

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.getElementsByTagName('td');
            const user_id = cells[USER_INDEX].getElementsByClassName('js-usercard')[0].getAttribute('data-user-id');
            const current_rank_str = cells[RANK_INDEX].textContent; //"#1", "#2", etc
            const current_rank = parseInt(current_rank_str.trim().slice(1)); //remove the "#" and parse to int

            //get title
            // const current_score_str = cells[SCORE_INDEX].children[0].getAttribute('title');
            const current_score_str = cells[SCORE_INDEX].textContent; //this is the human-readable
            const current_score = Number(current_score_str.replace(/,/g, ''));

            if(i==0){
                console.log(`Current rank: ${current_rank}, Current score: ${current_score}`);
            }

            const rank_change_data = data.find(d => d.osu_id == user_id);
            let change_rank = 0;
            let change_score = 0;

            if (rank_change_data) {
                let old_rank = parseInt(rank_change_data.rank);
                let old_score = parseInt(rank_change_data.ranked_score);
                change_rank = old_rank - current_rank;
                change_score = current_score - old_score;

                if (!rank_change_date) {
                    rank_change_date = new Date(rank_change_data.date);
                }
            }

            const rank_change_text = getRankChangeText(change_rank);
            row.insertBefore(rank_change_text, cells[RANK_CHANGE_INDEX]);

            const rank_change_icon = getRankChangeIcon(change_rank);
            row.insertBefore(rank_change_icon, cells[RANK_CHANGE_INDEX]);

            //human readable score change
            const score_change_text = getRankChangeText(change_score, true);
            row.insertBefore(score_change_text, cells[SCORE_CHANGE_INDEX]);

            const score_change_icon = getRankChangeIcon(change_score);
            row.insertBefore(score_change_icon, cells[SCORE_CHANGE_INDEX]);
        }

        //insert empty header cells for rank change at RANK_CHANGE_INDEX
        headerRow.insertBefore(document.createElement('th'), headerCells[RANK_CHANGE_INDEX]);
        headerRow.insertBefore(document.createElement('th'), headerCells[RANK_CHANGE_INDEX]);

        //insert empty header cells for score change at SCORE_CHANGE_INDEX
        headerRow.insertBefore(document.createElement('th'), headerCells[SCORE_CHANGE_INDEX]);
        headerRow.insertBefore(document.createElement('th'), headerCells[SCORE_CHANGE_INDEX]);

        if (rank_change_date) {
            //get the 2nd pagination
            const pagination = document.getElementsByClassName("pagination-v2")[1];

            //below this, add a text that tells us from what date the score difference is from
            const dateText = document.createElement("div");
            dateText.classList.add("ranking-page-table__date");
            dateText.textContent = `Rank changes are from ${rank_change_date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            })}`;
            pagination.parentNode.insertBefore(dateText, pagination);
        }
    }

    //replaces the accuracy column with a completion percentage column
    async function runScoreRankCompletionPercentages() {
        try {
            //check if we are on "/rankings/osu/score" page
            const _url = window.location.href;
            if (!_url.includes("/rankings/osu/score")) {
                return;
            }

            //wait for class 'ranking-page-table' to load
            await WaitForElement('.ranking-page-table');

            //get all the rows in the table
            //rows are in the tbody of the table
            const table = document.getElementsByClassName('ranking-page-table')[0];
            const thead = table.getElementsByTagName('thead')[0];
            const tbody = table.getElementsByTagName('tbody')[0];
            const rows = tbody.getElementsByTagName('tr');
            const headerRow = thead.getElementsByTagName('tr')[0];

            const LEADERBOARD_STRUCTURE = OFFICIAL_LEADERBOARD_STRUCTURES.score();

            //accuracy row is index 2
            const USER_INDEX = LEADERBOARD_STRUCTURE.indexOf("user");
            const ACCURACY_INDEX = LEADERBOARD_STRUCTURE.indexOf("accuracy");

            //change header to "Completion"
            const headerCells = headerRow.getElementsByTagName('th');
            headerCells[ACCURACY_INDEX].textContent = "Completion";

            //change all rows to completion percentage (first do a dash, then do the percentage when the data is loaded)
            let ids = [];
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const cells = row.getElementsByTagName('td');
                cells[ACCURACY_INDEX].textContent = "-";

                //get the user id from the data-user-id attribute
                //from column 1, get the the first child element with class 'js-usercard' in it, then get the data-user-id attribute
                const user_id = cells[USER_INDEX].getElementsByClassName('js-usercard')[0].getAttribute('data-user-id');
                ids.push(user_id);
            }

            //comma separated string
            const id_string = ids.join(',');

            const url = `${SCORE_INSPECTOR_API}users/stats/completion_percentage/${id_string}`;
            const response = await fetch(url, {
                headers: {
                    "Access-Control-Allow-Origin": "*"
                },
                signal: AbortSignal.timeout(5000)
            });


            const data = await response.json();

            if (data.error) {
                console.error(data.error);
                return;
            }

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const cells = row.getElementsByTagName('td');
                const user_id = cells[USER_INDEX].getElementsByClassName('js-usercard')[0].getAttribute('data-user-id');
                let completion_percentage = data.find(d => d.user_id == user_id)?.completion ?? "-";
                if (completion_percentage !== "-") {
                    //cap it at 100%, used profile stats for SS,S,A, which may be different from osu!alt
                    completion_percentage = Math.min(completion_percentage, 100);
                    completion_percentage = completion_percentage.toFixed(2);
                }

                //round to 2 decimal places
                cells[ACCURACY_INDEX].textContent = `${completion_percentage}%`;
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function runUserPage() {
        const url = window.location.href;
        let fixedUrl = url.endsWith("/") ? url.slice(0, -1) : url;
        let user_id = null;
        try {
            user_id = fixedUrl.match(/\/users\/(\d+)/)[1];
        } catch (e) { }
        if (!user_id) {
            return;
        }

        let mode = fixedUrl.match(/\/users\/\d+\/(osu|taiko|fruits|mania)/);
        mode = mode ? mode[1] : "osu";

        //wait for game-mode-link--active to load
        await WaitForElement(".game-mode-link--active");

        const activeModeElement = document.getElementsByClassName("game-mode-link game-mode-link--active")[0];
        if (activeModeElement) {
            mode = activeModeElement.getAttribute("data-mode");
        }

        await WaitForElement(PAGE_ELEMENT_WAIT_LIST.user_page);

        //get username (first span element in profile-info__name)
        const username = document.getElementsByClassName("profile-info__name")[0].getElementsByTagName("span")[0].textContent;

        const data = await getUserData(user_id, username, mode);

        const user_exists = data.user != null &&
            (typeof data.coe !== "undefined" || typeof data.coe.error !== "string")

        if (data.coe && !data.coe.error) {
            setOrCreateCoeBannerElement(data.coe);
        }

        if (GM_getValue("teams_show_team_tags", true) && data.team) {
            setOrCreateUserTeamTagElement(data.team);
            // setOrCreateTeamBannerElement(data.team);
        }

        if (data.completion) {
            setCompletionistBadges(data.completion);
        }

        //if theres more than just .coe
        if (data && Object.keys(data).length > 1) {
            setNewRankGraph(data.scoreRankHistory, data.stats?.scoreRank, user_exists);

            //if the user does not exist, give informational alert.
            if (!user_exists) {
                if (mode === "osu") {
                    //we only show the popup for osu! mode, other modes are not supported period.
                    // popup("No osu!alt statistics available for this user.");
                    setNoAvailableStatsLabel();
                }
                //skip other checks as redundant
                return;
            }
            setOrCreateStatisticsElements(data);
        }
    }

    function setNoAvailableStatsLabel() {
        const headerTitle = document.getElementsByClassName("header-v4__title")[0];
        headerTitle.style.display = "block";
        headerTitle.innerHTML = `<span>player info</span><span style="margin-left: 5px;font-size:12px;color:gray;">No osu!alt statistics available for this user.</span>`;
    }

    function setOrCreateUserTeamTagElement(team) {
        var userTagElement = document.getElementById("inspector_user_tag");
        var userTagParent = null;

        if (!userTagElement) {
            var profileNameParentNode = document.getElementsByClassName("profile-info__name")[0];
            userTagElement = profileNameParentNode.childNodes[0].cloneNode(true);
            userTagElement.id = "inspector_user_tag";

            var div = document.createElement("a");
            div.style.display = "inline";
            div.style.textDecoration = "none";
            div.appendChild(userTagElement);

            userTagParent = div;
            profileNameParentNode.insertBefore(div, profileNameParentNode.childNodes[0]);
        } else {
            userTagParent = userTagElement.parentNode;
        }

        userTagElement.textContent = `[${team.short_name}]`;
        userTagElement.style.color = `${team.color}`;
        userTagElement.style.marginRight = "5px";
        userTagElement.style.fontWeight = "bold";

        userTagParent.setAttribute("data-html-title", `<div>${team.name}</div>`);
        userTagParent.setAttribute("title", "");
        userTagParent.href = `https://osu.ppy.sh/teams/${team.id}`;
        userTagParent.target = "_blank";
    }

    async function WaitForElement(selector, timeout = 5000) {
        const startTime = new Date().getTime();
        while (document.querySelectorAll(selector).length == 0) {
            if (new Date().getTime() - startTime > timeout) {
                return null;
            }
            await new Promise(r => setTimeout(r, 100));
        }
    }

    async function getUserData(user_id, username, mode = "osu") {
        const modeIndex = MODE_SLUGS_ALT.indexOf(mode);
        let user_data = null;
        try {
            const _user_data = await fetch(`${SCORE_INSPECTOR_API}extension/profile`, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json"
                },
                method: "POST",
                body: JSON.stringify({
                    user_id: user_id,
                    mode: modeIndex,
                    username: username
                })
            });
            user_data = await _user_data.json();

            if (!user_data || user_data.error) {
                user_data = {};
            }

            //get COE data
            const coe_data = await fetch(`${SCORE_INSPECTOR_API}extension/coe/${user_id}`);
            user_data.coe = await coe_data.json();

            if (!user_data.coe.error) {
                //capitalize first letter of each word in the roles
                user_data.coe.user.roles = user_data.coe.user.roles.map(role => role.replace(/\b\w/g, l => l.toUpperCase()));

                //if affiliate is not null, add "Affiliate" to the roles
                if (user_data.coe.user.affiliate) {
                    user_data.coe.user.roles.push("Affiliate");
                }
            }

            return user_data;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    function setCompletionistBadges(badge_data) {
        if (!badge_data || badge_data.length === 0) {
            return;
        }

        //check if we have a badge area already (class "profile-badges"), otherwise create it
        var badgeArea = document.getElementsByClassName("profile-badges")[0];

        if (!badgeArea) {
            badgeArea = document.createElement("div");
            badgeArea.className = "profile-badges";

            //insert it before "profile-detail"
            const profileDetail = document.getElementsByClassName("profile-detail")[0];
            profileDetail.parentNode.insertBefore(badgeArea, profileDetail);
        }

        //order newest to oldest
        badge_data.sort((a, b) => new Date(b.completion_date) - new Date(a.completion_date));

        //create a badge for each completionist badge
        badge_data.forEach(badge => {
            if (badgeArea.querySelector(`img[src='https://assets.ppy.sh/profile-badges/completionist_${MODE_SLUGS[badge.mode]}.png']`)) {
                return;
            }

            var a = document.createElement("a");
            a.href = `https://score.kirino.sh/completionists`;

            badgeArea.appendChild(a);

            const date_object = new Date(badge.completion_date);
            const pretty_date = new Date(date_object).toLocaleDateString();

            var img = document.createElement("img");
            img.src = `https://assets.ppy.sh/profile-badges/completionist_${MODE_SLUGS[badge.mode]}.png`;
            img.className = "profile-badges__badge";
            a.setAttribute("data-html-title", `
                    <div>${MODE_NAMES[badge.mode]} completionist (awarded ${pretty_date})</div>
                    <div>Scores: ${badge.scores.toLocaleString()}</div>
                    <div class='profile-badges__date'>${date_object.toLocaleDateString("en-US", {
                month: 'long',
                day: '2-digit',
                year: 'numeric'
            })}</div>
                `);

            a.title = `${MODE_NAMES[badge.mode]} completionist (awarded ${pretty_date})`

            a.appendChild(img);
        });

        const badges = Array.from(badgeArea.children);
        if (badges && badges.length > 1) {
            for (let i = badges.length - 1; i > 0; i--) {
                const current = badges[i];
                const previous = badges[i - 1];

                //find both 'data-html-title' attributes in the current and next tree, may be on the element or any child element
                let current_data_html_title = searchElementForAttribute(current, "data-html-title");
                let previous_data_html_title = searchElementForAttribute(previous, "data-html-title");

                //find profile-badges__date
                const dateCurrent = current_data_html_title.match(/<div class='profile-badges__date'>(.*?)<\/div>/)[1] ?? "";
                const datePrevious = previous_data_html_title.match(/<div class='profile-badges__date'>(.*?)<\/div>/)[1] ?? "";

                //if previous is older than current, swap them
                if (new Date(datePrevious) < new Date(dateCurrent)) {
                    badgeArea.insertBefore(current, previous);
                }
            }
        }
    }

    function setOrCreateStatisticsElements(data) {
        //element with "profile-rank-count" class is the parent of the rank elements
        //every rank is an div element, that div has a child with the class "profile-rank--XH", "profile-rank--X", "profile-rank--SH", "profile-rank--S", "profile-rank--A"

        //we follow the structure to add B, C and D ranks
        var parent = document.getElementsByClassName("profile-rank-count")[0];

        if (GM_getValue("profile_show_extra_grades", true)) {
            //create the elements if they don't exist
            const ranks = ["B", "C", "D"];
            ranks.forEach(rank => {
                //if element exists, delete it
                if (document.getElementById(`inspector_elm_${rank.toLowerCase()}`)) {
                    document.getElementById(`inspector_elm_${rank.toLowerCase()}`).remove();
                }

                var b = document.createElement("div");
                b.id = `inspector_elm_${rank.toLowerCase()}`;
                var div = document.createElement("div");
                div.className = `score-rank score-rank--${rank} score-rank--profile-page`;
                b.appendChild(div);
                let rankText = null;
                if (data.user?.[`${rank.toLowerCase()}_count`] !== undefined && !isNaN(data.user?.[`${rank.toLowerCase()}_count`])) {
                    rankText = document.createTextNode(Number(data.user?.[`${rank.toLowerCase()}_count`]).toLocaleString());
                } else {
                    rankText = document.createTextNode('-');

                    //add a tooltip to explain the rank is not available
                    b.setAttribute("data-html-title", `<div>Data not available</div>`);
                    b.setAttribute("title", "");
                }
                b.appendChild(rankText);
                parent.appendChild(b);
            });

            //for all XH, X, SH, S, A ranks, we set a tooltip display alt values
            ["XH", "X", "SH", "S", "A"].forEach(rank => {
                var rankElement = document.getElementsByClassName(`score-rank--${rank}`)[0];
                if (rankElement) {
                    let _rank = rank.toLowerCase();
                    if (_rank === 'xh') _rank = 'ssh';
                    if (_rank === 'x') _rank = 'ss';
                    let val = Number(data.user?.[`alt_${_rank}_count`]).toLocaleString();
                    if (isNaN(Number(data.user?.[`alt_${_rank}_count`]))) val = 'Data not available';
                    rankElement.setAttribute("data-html-title", `
                        osu!alt: ${val}
                        `);
                    rankElement.setAttribute("title", "");
                }
            });

            //find the parent of score-rank--A
            var aParent = document.getElementsByClassName("score-rank--A")[0].parentNode;

            //add an element before aParent to force the next elements to be on the next line
            var br = document.createElement("div");
            //flex expand
            br.style.flexBasis = "100%";
            aParent.parentNode.insertBefore(br, aParent);

            //align all the elements to the right
            parent.style.justifyContent = "flex-end";
        }


        //grades done
        const profile_detail__rank = document.getElementsByClassName("profile-detail__values")[0];
        let profile_stat_index = 2;
        //if class daily-challenge exists, index is 2
        // if (document.getElementsByClassName("daily-challenge").length > 0) {
        //     profile_stat_index = 2;
        // }
        const profile_detail__values = document.getElementsByClassName("profile-detail__values")[profile_stat_index];

        // profile_detail__rank.style.gap = "8px";

        const clears = data.user ? (
            data.user.alt_ssh_count +
            data.user.alt_ss_count +
            data.user.alt_sh_count +
            data.user.alt_s_count +
            data.user.alt_a_count +
            data.user.b_count + data.user.c_count + data.user.d_count) : 'NaN';
        const profile_clears = data.user ? (data.user.ssh_count + data.user.ss_count + data.user.sh_count + data.user.s_count + data.user.a_count) : 'NaN';
        var clearsDisplay = getValueDisplay("inspector_elm_clears", "Clears", clears ? Number(clears).toLocaleString() : null, false, `Profile clears: ${Number(profile_clears).toLocaleString()}`);
        if (document.getElementById("inspector_elm_clears")) { document.getElementById("inspector_elm_clears").remove(); }
        profile_detail__values.appendChild(clearsDisplay);

        var completionDisplay = getValueDisplay("inspector_elm_completion", "Completion", !isNaN(clears) ? `${(data.user?.completion ?? 0).toFixed(2)}%` : "NaN");
        if (document.getElementById("inspector_elm_completion")) { document.getElementById("inspector_elm_completion").remove(); }
        profile_detail__values.appendChild(completionDisplay);

        var top50sDisplay = getValueDisplay("inspector_elm_top50s", "Top 50s", Number(data.stats?.top50s ?? 0).toLocaleString());
        if (document.getElementById("inspector_elm_top50s")) { document.getElementById("inspector_elm_top50s").remove(); }
        profile_detail__values.appendChild(top50sDisplay);

        var globalSSrankDisplay = getValueDisplay("inspector_elm_ss_rank", "SS Ranking", Number(data.user?.global_ss_rank).toLocaleString(), true, `Highest rank: #${Number(data.user?.global_ss_rank_highest ?? 0).toLocaleString()} on ${data.user?.global_ss_rank_highest_date ? new Date(data.user?.global_ss_rank_highest_date).toLocaleDateString("en-GB", {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }) : "N/A"
            }`);
        if (document.getElementById("inspector_elm_ss_rank")) { document.getElementById("inspector_elm_ss_rank").remove(); }
        profile_detail__rank.appendChild(globalSSrankDisplay);

        var countrySSrankDisplay = getValueDisplay("inspector_elm_ss_c_rank", "Country SS Ranking", Number(data.user?.country_ss_rank).toLocaleString(), true, `Highest rank: #${Number(data.user?.country_ss_rank_highest ?? 0).toLocaleString()} on ${data.user?.country_ss_rank_highest_date ? new Date(data.user?.country_ss_rank_highest_date).toLocaleDateString("en-GB", {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }) : "N/A"
            }`);
        if (document.getElementById("inspector_elm_ss_c_rank")) { document.getElementById("inspector_elm_ss_c_rank").remove(); }
        profile_detail__rank.appendChild(countrySSrankDisplay);

        profile_detail__values.style.rowGap = "5px";

        //find element with class "profile-detail__chart-numbers profile-detail__chart-numbers--top"
        var chartNumbers = document.getElementsByClassName("profile-detail__chart-numbers profile-detail__chart-numbers--top")[0];
        var profileDetails = document.getElementsByClassName("profile-detail")[0];
        profileDetails.insertBefore(chartNumbers, profileDetails.childNodes[0]);
    }

    function getValueDisplay(id, label, value, is_rank = false, tooltip = null) {
        var div = document.createElement("div");
        div.id = id;
        div.className = `value-display value-display--${is_rank ? 'rank' : 'plain'}`;
        var labelDiv = document.createElement("div");
        labelDiv.className = "value-display__label";
        labelDiv.textContent = label;
        div.appendChild(labelDiv);
        var valueDiv = document.createElement("div");
        valueDiv.className = "value-display__value";
        if (value === 'NaN') {
            valueDiv.textContent = `-`;
            div.setAttribute("data-html-title", `<div>Data not available</div>`);
            div.setAttribute("title", "");
        } else {
            valueDiv.textContent = `${is_rank ? '#' : ''}${value}`;
            if (tooltip) {
                valueDiv.setAttribute("data-html-title", `<div>${tooltip}</div>`);
                valueDiv.setAttribute("title", "");
            }
        }
        div.appendChild(valueDiv);
        return div;
    }

    function getBannerIndex() {
        const mainElement = document.querySelector("[data-page-id='main']");
        const coverIndex = Array.from(mainElement.children).findIndex(child => child.classList.contains("profile-cover"));
        return { mainElement, coverIndex };
    }

    function setOrCreateTeamBannerElement(team) {
        const { mainElement, coverIndex } = getBannerIndex();

        var teamBanner = document.getElementById("inspector_team_banner");
        if (teamBanner) {
            //remove it and re-add it
            teamBanner.remove();
        }
        teamBanner = getBaseBannerElement("inspector_team_banner", team.header_url ?? IMAGE_DEFAULT_TEAM_BG, true);

        let p_extra_info = `<p style="color: gray;">Members: ${team.members}</p>`;

        var rawHtml = `
            <div style="display: flex; align-items: center; height: 100%;">
                <div style="display: flex; flex-direction: row; justify-content: center;">
                    <div style="display: flex; flex-direction: column; justify-content: center; margin-right: 1rem;">
                        <p style="margin-bottom: 0px; font-size: 22px; color: white;">
                            <i class="fas fa-users"></i>
                        </p>
                    </div>
                    <div style="display: flex; flex-direction: column; justify-content: center;">
                        <p style="margin-bottom: 0px; font-size: 22px;">Member of <a href="https://osu.ppy.sh/teams/${team.id}" target="_blank"><span id="inspector_user_clan_tag" style='color:${team.color}'></span> <span id="inspector_user_clan_name"></span></a></p>
                        ${p_extra_info}
                    </div>
                </div>
            </div>
        `;

        var overlay = teamBanner.querySelector("#inspector_user_banner_overlay");
        overlay.innerHTML = rawHtml;

        var clanTagElement = overlay.querySelector("#inspector_user_clan_tag");
        clanTagElement.innerText = `[${team.short_name}]`;

        var clanNameElement = overlay.querySelector("#inspector_user_clan_name");
        clanNameElement.innerText = team.name;

        mainElement.insertBefore(teamBanner, mainElement.children[coverIndex + 2]);
    }

    function setOrCreateCoeBannerElement(coe) {
        const { mainElement, coverIndex } = getBannerIndex();

        var coeBanner = document.getElementById("inspector_coe_banner");
        if (coeBanner) {
            //remove it and re-add it
            coeBanner.remove();
        }
        coeBanner = getBaseBannerElement("inspector_coe_banner", "https://kirino.sh/d/coe_bg.png", false);

        // var coeTag = document.createElement("div");
        // coeTag.style.color = "white";
        // coeTag.style.fontWeight = "light";
        // coeTag.style.fontSize = "20px";
        // coeTag.innerHTML = `<p style="margin-bottom: 0px;">COE Attendee</p>`;
        var overlay = coeBanner.querySelector("#inspector_user_banner_overlay");
        // overlay.appendChild(coeTag);

        //coe logo on the left, followed by text
        //logo: https://kirino.sh/d/coe_logo.png (automatic width, full height)
        //text: COE Attendee above, temp text under it
        var rawHtml = `
            <div style="display: flex; align-items: center; height: 100%;">
                <a href="https://cavoeboy.com/" target="_blank" style="display: flex; align-items: center; height: 100%;">
                    <img src="https://kirino.sh/d/coe_logo.svg" style="height: 55%; margin-right: 10px;">
                </a>
                <div style="display: flex; flex-direction: column; justify-content: center;">
                    <p style="margin-bottom: 0px; font-size: 18px;">Attendee${coe.user.roles?.length > 0 ? " / " + coe.user.roles.join(" / ") : ""}</p>
                    <p style="margin-bottom: 0px; font-size: 12px;">${COE_ATTENDEE_TYPES[coe.ticketType] ?? "Unknown Ticket Type"}</p>
                </div>
            </div>
        `;
        overlay.innerHTML = rawHtml;

        //insert it after the cover
        mainElement.insertBefore(coeBanner, mainElement.children[coverIndex + 2]);
    }

    function getBaseBannerElement(id, image, overlay_tint = true) {
        var banner = document.createElement("div");
        banner.id = id;

        banner.style.width = "100%";
        banner.style.height = "60px";

        if (image) {
            const parsed_image = new URL(image);
            banner.style.backgroundImage = `url(${parsed_image})`;
            banner.style.backgroundSize = "cover";
            banner.style.backgroundPosition = "center";
        }

        var overlay = document.createElement("div");
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = `rgba(0, 0, 0, ${overlay_tint ? 0.7 : 0})`;
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "left";
        overlay.style.paddingLeft = "50px";
        overlay.id = "inspector_user_banner_overlay";
        banner.appendChild(overlay);

        return banner;
    }

    let activeChart = 'pp';
    let ppRankData = null;
    let scoreRankData = null;
    let graphHue = 0;
    function setNewRankGraph(score_rank_history, current_rank, reorder_elements) {
        const TODAY = new Date();

        const cloned_rank_history = [...score_rank_history ?? []];
        if (current_rank) {
            cloned_rank_history.push({
                ...cloned_rank_history[cloned_rank_history.length - 1],
                //date as YYYY-MM-DD
                date: new Date().toISOString().split('T')[0],
                rank: current_rank
            });
        }

        const layout = document.getElementsByClassName("js-react--profile-page u-contents")[0];
        const data = layout.getAttribute("data-initial-data");
        const parsedData = JSON.parse(data);
        graphHue = parsedData.user.profile_hue;
        const rankHistory = parsedData.user.rank_history.data ?? parsedData.user.rankHistory.data ?? [];

        //generate data for pp rank (array is a simple number array [0,5,25,7763,...] sorted oldest to newest, 89d ago to today, convert it to object array {date,rank})
        const pp_ranks_filled = [];
        rankHistory.reverse().forEach((rank, i) => {
            const date = new Date(TODAY - (1000 * 60 * 60 * 24) * i);
            pp_ranks_filled.push({ date, rank });
        });

        ppRankData = pp_ranks_filled;

        //if no pp rank data, or last pp rank is 0, then return;
        if (!ppRankData || ppRankData.length === 0 || ppRankData[0].rank === 0) {
            return;
        }

        scoreRankData = (cloned_rank_history && cloned_rank_history.length > 2) ? cloned_rank_history : null;

        //find with class "line-chart line-chart--profile-page"
        const lineChart = document.getElementsByClassName("profile-detail__chart")[0];
        if (lineChart) {
            const chartParent = lineChart.parentNode;
            lineChart.remove();

            //create chart context
            const chartOwner = document.createElement("div");
            const chart = document.createElement("canvas");
            chart.id = "custom_rank_chart";

            chartOwner.appendChild(chart);
            chartOwner.style.width = "100%";
            chartOwner.style.height = "90px";
            chartOwner.style.marginTop = "10px";
            chartOwner.style.marginBottom = "30px";

            const getRankSet = (graph) => {
                switch (graph) {
                    case "Performance":
                        return ppRankData;
                    case "Score":
                        return scoreRankData;
                }
            }

            const toggleLink = document.createElement("div");
            const updateLinks = () => {
                //remove all children
                while (toggleLink.firstChild) {
                    toggleLink.removeChild(toggleLink.firstChild);
                }
                if (!scoreRankData || scoreRankData.length === 0) {
                    CURRENT_GRAPH = "Performance";
                }
                GRAPHS.forEach(graph => {

                    const graphData = getRankSet(graph);
                    let span = document.createElement(CURRENT_GRAPH === graph ? "span" : "a");
                    // span.style.color = CURRENT_GRAPH !== graph ? "#fc2" : "white";
                    span.style.color = CURRENT_GRAPH !== graph ? (graphHue ? `hsl(${graphHue}, 40%, 80%)` : "#fc2") : "white";
                    if (CURRENT_GRAPH !== graph) {
                        span.href = "javascript:void(0)";
                        span.style.textDecoration = "underline";
                        if (graphData) {
                            span.onclick = () => {
                                updateGraph(graphData, graph);
                                CURRENT_GRAPH = graph;
                                GM_setValue("inspector_current_graph", CURRENT_GRAPH);
                                updateLinks();
                            }
                        } else {
                            //disable link cursor when hover
                            span.style.cursor = "default";
                            //add a tooltip to explain the rank is not available
                            span.setAttribute("data-html-title", `<div>Data not available</div>`);
                            span.setAttribute("title", "");
                            //strike through
                            span.style.textDecoration = "line-through";
                        }
                    }
                    span.style.fontSize = "12px";
                    span.style.marginRight = "5px";
                    span.textContent = graph;
                    toggleLink.appendChild(span);
                });
            }
            updateLinks();

            chartParent.insertBefore(chartOwner, chartParent.children[reorder_elements ? 0 : 1]);
            //insert the toggle after the chart
            chartParent.insertBefore(toggleLink, chartParent.children[reorder_elements ? 1 : 2]);

            //completely REMOVES the link if there is no score rank data
            // if (!scoreRankData || scoreRankData.length === 0) {
            //     toggleLink.remove();
            // }

        }

        if (scoreRankData && scoreRankData.length > 0) {
            switch (CURRENT_GRAPH) {
                case "Performance":
                    updateGraph(ppRankData, "PP Rank");
                    break;
                case "Score":
                    updateGraph(scoreRankData, "Score Rank");
                    break;
            }
        } else {
            updateGraph(ppRankData, "PP Rank");
        }
    }

    let _chart = null;
    let _chart_data = null;
    function updateGraph(rank_data, rank_type) {
        let ctx = document.getElementById("custom_rank_chart");
        //destroy previous chart
        if (ctx) {
            let _clone = ctx.cloneNode(true);
            ctx.parentNode.replaceChild(_clone, ctx);
            ctx = _clone;
        }

        const data = {
            type: 'line',
            data: {
                labels: rank_data.map(data => data.date),
                datasets: [{
                    label: rank_type,
                    data: rank_data.map(data => data.rank),
                    // borderColor: '#fc2',
                    borderColor: graphHue ? `hsl(${graphHue}, 50%, 45%)` : '#fc2',
                    tension: 0.1,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day'
                        },
                        display: false,
                        grace: '10%',
                        offset: true
                    },
                    y: {
                        reverse: true,
                        display: false,
                        grace: '10%'
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false,
                        position: 'nearest',
                        external: externalTooltipHandler,
                        callbacks: {
                            title: function (context) {
                                // return context[0].raw;
                                // return new Date(context[0].parsed.x).toLocaleDateString();
                                //show days ago / today
                                const date = context[0].parsed.x;
                                const today = new Date();
                                const days = Math.floor((today - date) / (1000 * 60 * 60 * 24));
                                if (days === 0)
                                    return "Today";
                                return `${days} day${days > 1 ? "s" : ""} ago`;
                            },
                            label: function (context) {
                                return context.dataset.label + ": #" + context.parsed.y.toLocaleString('en-US');
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 0,
                        hoverRadius: 10,
                        hitRadius: 10,
                        hoverBorderWidth: 5
                    },
                    line: {
                        borderWidth: 2
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        };

        _chart_data = data;
        _chart = new Chart(ctx, data);
    }

    //when finished resizing window, regenerate the chart (just resize wont work due to how to site works)
    window.addEventListener('resize', () => {
        if (_chart) {
            _chart.destroy();
            _chart = new Chart(document.getElementById("custom_rank_chart"), _chart_data);
        }
    });

    const getOrCreateTooltip = (chart) => {
        let tooltipEl = chart.canvas.parentNode.querySelector('div');

        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.style.background = 'rgba(0, 0, 0, 0.7)';
            tooltipEl.style.borderRadius = '3px';
            tooltipEl.style.color = 'white';
            tooltipEl.style.opacity = 1;
            tooltipEl.style.pointerEvents = 'none';
            tooltipEl.style.position = 'absolute';
            tooltipEl.style.transform = 'translate(-50%, -140%)';
            tooltipEl.style.transition = 'all .1s ease';

            const table = document.createElement('table');
            table.style.margin = '0px';

            tooltipEl.appendChild(table);
            chart.canvas.parentNode.appendChild(tooltipEl);
        }

        return tooltipEl;
    };

    const externalTooltipHandler = (context) => {
        // Tooltip Element
        const { chart, tooltip } = context;
        const tooltipEl = getOrCreateTooltip(chart);

        // Hide if no tooltip
        if (tooltip.opacity === 0) {
            tooltipEl.style.opacity = 0;
            return;
        }

        // Set Text
        if (tooltip.body) {
            const titleLines = tooltip.title || [];
            const bodyLines = tooltip.body.map(b => b.lines);

            const tableHead = document.createElement('thead');

            titleLines.forEach(title => {
                const tr = document.createElement('tr');
                tr.style.borderWidth = 0;

                const th = document.createElement('th');
                th.style.borderWidth = 0;
                const text = document.createTextNode(title);

                th.appendChild(text);
                tr.appendChild(th);
                tableHead.appendChild(tr);
            });

            const tableBody = document.createElement('tbody');
            bodyLines.forEach((body, i) => {
                const colors = tooltip.labelColors[i];

                const span = document.createElement('span');
                span.style.background = colors.backgroundColor;
                span.style.borderColor = colors.borderColor;
                span.style.borderWidth = '2px';
                span.style.marginRight = '10px';
                span.style.height = '10px';
                span.style.width = '10px';
                span.style.display = 'inline-block';

                const tr = document.createElement('tr');
                tr.style.backgroundColor = 'inherit';
                tr.style.borderWidth = 0;

                const td = document.createElement('td');
                td.style.borderWidth = 0;

                const text = document.createTextNode(body);

                td.appendChild(span);
                td.appendChild(text);
                tr.appendChild(td);
                tableBody.appendChild(tr);
            });

            const tableRoot = tooltipEl.querySelector('table');

            // Remove old children
            while (tableRoot.firstChild) {
                tableRoot.firstChild.remove();
            }

            // Add new children
            tableRoot.appendChild(tableHead);
            tableRoot.appendChild(tableBody);
        }

        const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;

        // Display, position, and set styles for font
        tooltipEl.style.opacity = 1;
        tooltipEl.style.left = positionX + tooltip.caretX + 'px';
        tooltipEl.style.top = positionY + tooltip.caretY + 'px';
        tooltipEl.style.font = tooltip.options.bodyFont.string;
        tooltipEl.style.padding = tooltip.options.padding + 'px ' + tooltip.options.padding + 'px';
    };

    function searchElementForAttribute(element, attribute) {
        if (element.getAttribute(attribute)) {
            return element.getAttribute(attribute);
        }

        for (let i = 0; i < element.children.length; i++) {
            const child = element.children[i];
            if (child.getAttribute(attribute)) {
                return child.getAttribute(attribute);
            }
        }

        return null;
    }

    function formatNumberAsSize(number) {
        if (number >= 1e12) {
            return (number / 1e12).toFixed(1) + 'T';
        } else if (number >= 1e9) {
            return (number / 1e9).toFixed(1) + 'B';
        } else if (number >= 1e6) {
            return (number / 1e6).toFixed(1) + 'M';
        } else if (number >= 1e3) {
            return (number / 1e3).toFixed(1) + 'K';
        } else {
            return number.toString();
        }
    }

    const defaultNumberFormatter = new Intl.NumberFormat(window.currentLocale);
    function formatNumber(num, precision, options, locale) {
        if (num === null || num === undefined || !num || isNaN(num) || num === Infinity || num === -Infinity) {
            return num;
        }

        if (precision == null && options == null && locale == null) {
            return defaultNumberFormatter.format(num);
        }

        options ??= {};

        if (precision != null) {
            options.minimumFractionDigits = precision;
            options.maximumFractionDigits = precision;
        }

        return num.toLocaleString(locale ?? window.currentLocale, options);
    }

    async function getBeatmapData(beatmap_id, mode, mods = null) {
        if (!beatmap_id || isNaN(beatmap_id)) {
            return null;
        }

        try {
            // const _beatmap_data = await fetch(`${SCORE_INSPECTOR_API}beatmaps/${beatmap_id}`);
            // beatmap_data = _beatmap_data.json();
            // return beatmap_data;
            //find script with ID "json-beatmapset", this contains a JSON object of the whole beatmapset
            const beatmapset_script = document.getElementById("json-beatmapset");
            if (!beatmapset_script) {
                return null;
            }

            const beatmapset_data = JSON.parse(beatmapset_script.innerHTML);
            let beatmap_data = beatmapset_data?.beatmaps.find(b => b.id === Number(beatmap_id) && b.mode === mode);

            if (!beatmap_data) {
                beatmap_data = beatmapset_data?.converts.find(b => b.id === Number(beatmap_id) && b.mode === mode);
            }

            const attributes = await getBeatmapAttributes(beatmap_id, MODE_SLUGS_ALT.indexOf(mode), mods);

            return {
                beatmapset_data,
                beatmap_data,
                attributes: attributes,
            };
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    async function getBeatmapAttributes(beatmap_id, ruleset_id, mods = null) {
        try {
            const attributes = await fetch(`${SCORE_INSPECTOR_API}extension/difficulty/${beatmap_id}/${ruleset_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    mods
                })
            });

            return (await attributes.json())?.attributes ?? null;
        }
        catch (err) {
            console.error(err);
            return null;
        }
    }

    function getRulesetIconSpan(ruleset_id) {
        const ruleset_icon = document.createElement("span");
        ruleset_icon.classList.add("fal", `fa-extra-mode-${MODE_SLUGS_ALT[ruleset_id]}`);
        return ruleset_icon;
    }

    //url observer
    //triggers events when the url changes

    // let currentUrl = window.location.href;

    if (window.onurlchange === null) {
        console.log("[inspector] registering URL change observer");
        window.addEventListener('urlchange', function (e) {
            run("urlchange");
        });
    }

    function getCalculator(score, statistics = null) {
        switch (score.ruleset_id) {
            case 0:
                return new OsuPerformanceCalculator(score, statistics);
            case 1:
                return new TaikoPerformanceCalculator(score, statistics);
            case 2:
                return new CatchPerformanceCalculator(score, statistics);
            case 3:
                return new ManiaPerformanceCalculator(score, statistics);
            default:
                throw new Error(`Unknown ruleset ID: ${score.ruleset_id}`);
        }
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }


    //Models and classes
    class Score {
        constructor(obj, attributes, beatmap = null) {
            if (!obj.beatmap && beatmap)
                obj.beatmap = beatmap;

            this.classic_total_score = obj.classic_total_score;
            this.preserve = obj.preserve;
            this.processed = obj.processed;
            this.ranked = obj.ranked;
            this.maximum_statistics = {
                ...obj.maximum_statistics,
                max_combo: obj.beatmap.max_combo,
                accuracy: 1,
            };
            this.mods = new Mods(obj.mods);
            this.statistics = {
                ...obj.statistics,
                max_combo: obj.max_combo,
                accuracy: obj.accuracy,
            };
            this.total_score_without_mods = obj.total_score_without_mods;
            this.beatmap_id = obj.beatmap_id;
            this.best_id = obj.best_id;
            this.id = obj.id;
            this.rank = obj.rank;
            this.type = obj.type;
            this.user_id = obj.user_id;
            this.accuracy = obj.accuracy;
            this.build_id = obj.build_id;
            this.ended_at = obj.ended_at;
            this.has_replay = obj.has_replay;
            this.is_perfect_combo = obj.is_perfect_combo;
            this.legacy_perfect_combo = obj.legacy_perfect_combo;
            this.legacy_score_id = obj.legacy_score_id;
            this.legacy_total_score = obj.legacy_total_score;
            this.max_combo = obj.max_combo;
            this.passed = obj.passed;
            this.pp = obj.pp;
            this.ruleset_id = obj.ruleset_id;
            this.ruleset = MODE_SLUGS_ALT[this.ruleset_id];
            this.started_at = obj.started_at;
            this.total_score = obj.total_score;
            this.replay = obj.replay;
            this.rank_global = obj.rank_global;
            if (obj.user)
                this.user = new User(obj.user);
            if (obj.beatmap) {
                this.beatmap = new Beatmap(obj.beatmap);
                this.difficulty = new BeatmapDifficulty(this.beatmap, this.mods, attributes);
            }
            this.fc_statistics = this.getFullcomboStatistics();
            this.calculator = getCalculator(this);
            this.calculator_fc = getCalculator(this, this.fc_statistics);
            this.calculator_ss = getCalculator(this, this.maximum_statistics);
        }

        ApplyUser(user) {
            //if user is null, do nothing
            if (!user) return;
            //check if user is already from class User
            if (user instanceof User) {
                this.user = user;
            } else {
                this.user = new User(user);
            }
        }

        getFullcomboStatistics() {
            //convert statistics into a full combo statistics object
            //(statistics_max is for SS scores, not full combo)
            let stats = { ...this.statistics };

            switch (this.ruleset_id) {
                case 0:
                    stats.great = (stats.great ?? 0) + (stats.miss ?? 0);
                    stats.miss = 0;
                    if (!Mods.hasMod(this.mods, "CL") || Mods.getSetting(this.mods, 'no_slider_head_accuracy') === false)
                        stats.slider_tail_hit = this.beatmap.count_sliders;
                    break;
                case 1:
                    stats.great = (stats.great ?? 0) + (stats.miss ?? 0);
                    stats.miss = 0;
            }
            stats.accuracy = this.recalculateAccuracy(stats);
            stats.max_combo = this.beatmap.max_combo;

            return stats;
        }

        recalculateAccuracy(statistics) {
            let baseScore = 0;
            Object.keys(statistics).forEach(key => {
                if (this.affectsAccuracy(key)) {
                    baseScore += statistics[key] * this.GetBaseScoreForResult(key);
                }
            });
            let maxBaseScore = 0;
            Object.keys(this.maximum_statistics).forEach(key => {
                if (this.affectsAccuracy(key)) {
                    maxBaseScore += this.maximum_statistics[key] * this.GetBaseScoreForResult(key);
                }
            });

            return maxBaseScore === 0 ? 1 : baseScore / maxBaseScore;
        }

        GetBaseScoreForResult(result) {
            switch (result) {
                default:
                    return 0;
                case 'small_tick_hit':
                    return 10;
                case 'large_tick_hit':
                    return 30;
                case 'slider_tail_hit':
                    return 150;
                case 'meh':
                    return 50;
                case 'ok':
                    return 100;
                case 'good':
                    return 200;
                case 'great':
                case 'perfect':
                    return 300;
                case 'small_bonus':
                    return 10;
                case 'large_bonus':
                    return 50;
            }
        }

        affectsAccuracy(result) {
            switch (result) {
                case "legacy_combo_increase":
                    return false;
                case "combo_break":
                    return false;
                default:
                    return this.isScorable(result) && !this.isBonus(result);
            }
        }

        isScorable(result) {
            switch (result) {
                case "legacy_combo_increase":
                    return true;
                case "combo_break":
                    return true;
                case "slider_tail_hit":
                    return true;
                default:
                    return result !== "none" && result !== "ignore_miss";
            }
        }

        isBonus(result) {
            switch (result) {
                case "small_bonus":
                case "large_bonus":
                    return true;

                default:
                    return false;
            }
        }
    }

    class Beatmap {
        constructor(obj) {
            this.beatmapset_id = obj.beatmapset_id;
            this.difficulty_rating = obj.difficulty_rating;
            this.id = obj.id;
            this.mode = obj.mode;
            this.approved = obj.approved;
            this.total_length = obj.total_length;
            this.user_id = obj.user_id;
            this.version = obj.version;
            this.accuracy = obj.accuracy;
            this.ar = obj.ar;
            this.bpm = obj.bpm;
            this.convert = obj.convert;
            this.count_circles = obj.count_circles;
            this.count_sliders = obj.count_sliders;
            this.count_spinners = obj.count_spinners;
            this.cs = obj.cs;
            this.deleted_at = obj.deleted_at;
            this.drain = obj.drain;
            this.hit_length = obj.hit_length;
            this.is_scoreable = obj.is_scoreable;
            this.last_updated = obj.last_updated;
            this.mode_int = obj.mode_int;
            this.passcount = obj.passcount;
            this.playcount = obj.playcount;
            this.ranked = obj.ranked;
            this.url = obj.url;
            this.checksum = obj.checksum;
            this.max_combo = obj.max_combo;
        }
    }

    class User {
        constructor(obj) {
            this.avatar_url = obj.avatar_url;
            this.country_code = obj.country_code;
            this.default_group = obj.default_group;
            this.id = obj.id;
            this.is_active = obj.is_active;
            this.is_bot = obj.is_bot;
            this.is_deleted = obj.is_deleted;
            this.is_online = obj.is_online;
            this.is_supporter = obj.is_supporter;
            this.last_visit = obj.last_visit;
            this.pm_friends_only = obj.pm_friends_only;
            this.profile_colour = obj.profile_colour;
            this.username = obj.username;
            this.country = obj.country;
            this.cover = obj.cover;
            this.groups = obj.groups;
            this.team = obj.team;
        }
    }

    class BeatmapDifficulty {
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

    class DifficultyRange {
        constructor(result, min, average, max) {
            this.result = result;
            this.min = min;
            this.average = average;
            this.max = max;
        }
    }

    class BeatmapDifficultyInfo {
        static DifficultyRange(difficulty, min = null, mid = null, max = null) {
            if (!min && !mid && !max)
                return (difficulty - 5) / 5;

            if (difficulty > 5)
                return mid + (max - mid) * BeatmapDifficultyInfo.DifficultyRange(difficulty);
            if (difficulty < 5)
                return mid + (mid - min) * BeatmapDifficultyInfo.DifficultyRange(difficulty);
        }
    }

    const HitResult = {
        None: 0,
        Miss: 1,
        Meh: 2,
        Ok: 3,
        Good: 4,
        Great: 5,
        Perfect: 6,
        SmallTickMiss: 7,
        SmallTickHit: 8,
        LargeTickMiss: 9,
        LargeTickHit: 10,
        SmallBonus: 11,
        LargeBonus: 12,
        IgnoreMiss: 13,
        IgnoreHit: 14,
        ComboBreak: 15,
        SliderTailHit: 16,
        LegacyComboIncrease: 17,
    }

    class HitWindows {
        constructor() {
            this.perfect = 0;
            this.great = 0;
            this.good = 0;
            this.ok = 0;
            this.meh = 0;
            this.miss = 0;
        }

        SetDifficulty(difficulty) {
            for (let range of this.GetRanges()) {
                let value = BeatmapDifficultyInfo.DifficultyRange(difficulty, range.min, range.average, range.max);

                switch (range.result) {
                    case HitResult.Miss:
                        this.miss = value;
                        break;
                    case HitResult.Meh:
                        this.meh = value;
                        break;
                    case HitResult.Ok:
                        this.ok = value;
                        break;
                    case HitResult.Good:
                        this.good = value;
                        break;
                    case HitResult.Great:
                        this.great = value;
                        break;
                    case HitResult.Perfect:
                        this.perfect = value;
                        break;
                }
            }
        }

        WindowFor(result) {
            switch (result) {
                case HitResult.Perfect:
                    return this.perfect;
                case HitResult.Great:
                    return this.great;
                case HitResult.Good:
                    return this.good;
                case HitResult.Ok:
                    return this.ok;
                case HitResult.Meh:
                    return this.meh;
                case HitResult.Miss:
                    return this.miss;
                default:
                    throw new Error(`Invalid enum value ${result}`);
            }
        }

        GetRanges() {
            return [];
        }
    }

    class OsuHitWindows extends HitWindows {
        constructor() {
            super();

            this.MISS_WINDOW = 400;
            this.OSU_RANGES = [
                new DifficultyRange(HitResult.Great, 80, 50, 20),
                new DifficultyRange(HitResult.Ok, 140, 100, 60),
                new DifficultyRange(HitResult.Meh, 200, 150, 100),
                new DifficultyRange(HitResult.Miss, this.MISS_WINDOW, this.MISS_WINDOW, this.MISS_WINDOW)
            ];
        }

        SetDifficulty(difficulty) {
            super.SetDifficulty(difficulty);
        }

        IsHitResultAllowed(result) {
            switch (result) {
                case HitResult.Great:
                case HitResult.Ok:
                case HitResult.Meh:
                case HitResult.Miss:
                    return true;
            }
            return false;
        }

        GetRanges() { return this.OSU_RANGES; }
    }

    class TaikoHitWindows extends HitWindows {
        constructor() {
            super();

            this.TAIKO_RANGES = [
                new DifficultyRange(HitResult.Great, 50, 35, 20),
                new DifficultyRange(HitResult.Ok, 120, 80, 50),
                new DifficultyRange(HitResult.Miss, 135, 95, 70)
            ];
        }

        IsHitResultAllowed(result) {
            switch (result) {
                case HitResult.Great:
                case HitResult.Ok:
                case HitResult.Miss:
                    return true;
            }
            return false;
        }

        GetRanges() { return this.TAIKO_RANGES; }
    }

    class PerformanceCalculator {
        constructor(score, statistics) {
            this.score = score;
            this.statistics = statistics ?? score.statistics;

            this.clockRate = Mods.getClockRate(this.score.mods);
        }

        calculate() {
            throw new Error("calculate() not implemented");
        }
    }

    class OsuPerformanceCalculator extends PerformanceCalculator {
        constructor(score, statistics) {
            super(score, statistics);

            const PERFORMANCE_BASE_MULTIPLIER = 1.15;

            this.usingClassicSliderAccuracy = false;
            if (Mods.hasMod(this.score.mods, "CL")) {
                if (!Mods.containsSetting(this.score.mods, 'no_slider_head_accuracy') || Mods.getSetting(this.score.mods, 'no_slider_head_accuracy') === false)
                    this.usingClassicSliderAccuracy = true;
            }

            this.effectiveMissCount = this.statistics.miss ?? 0;
            this.totalImperfectHits = (this.statistics.meh ?? 0) + (this.statistics.ok ?? 0) + (this.statistics.miss ?? 0);
            this.countSliderEndsDropped = this.statistics.slider_tail_hit ? (this.score.beatmap.count_sliders - this.statistics.slider_tail_hit) : 0;
            this.countSliderTickMiss = (this.statistics.large_tick_miss ?? 0);
            this.totalHits = (this.statistics.great ?? 0) + (this.statistics.ok ?? 0) + (this.statistics.meh ?? 0) + (this.statistics.miss ?? 0);
            this.totalSuccessfulHits = (this.statistics.great ?? 0) + (this.statistics.ok ?? 0) + (this.statistics.meh ?? 0);

            this.clockRate = Mods.getClockRate(this.score.mods);
            this.hitWindows = new OsuHitWindows();
            this.hitWindows.SetDifficulty(this.score.difficulty.overall_difficulty);

            this.greatHitWindow = this.hitWindows.WindowFor(HitResult.Great) / this.clockRate;
            this.okHitWindow = this.hitWindows.WindowFor(HitResult.Ok) / this.clockRate;
            this.mehHitWindow = this.hitWindows.WindowFor(HitResult.Meh) / this.clockRate;

            let preempt = BeatmapDifficultyInfo.DifficultyRange(this.score.difficulty.approach_rate, 1800, 1200, 450) / this.clockRate;

            this.overall_difficulty = (80 - this.greatHitWindow) / 6;
            this.approach_rate = preempt > 1200 ? (1800 - preempt) / 120 : (1200 - preempt) / 150 + 5;

            if (this.score.beatmap.count_sliders > 0) {
                if (this.usingClassicSliderAccuracy) {
                    let fullComboThreshold = this.score.beatmap.max_combo - 0.1 * this.score.beatmap.count_sliders;
                    if (this.statistics.max_combo < fullComboThreshold)
                        this.effectiveMissCount = fullComboThreshold / Math.max(1, this.statistics.max_combo);
                    this.effectiveMissCount = Math.min(this.effectiveMissCount, this.totalImperfectHits);
                } else {
                    let fullComboThreshold = this.score.beatmap.max_combo - this.countSliderEndsDropped;
                    if (this.statistics.max_combo < fullComboThreshold)
                        this.effectiveMissCount = fullComboThreshold / Math.max(1, this.statistics.max_combo);
                    this.effectiveMissCount = Math.min(this.effectiveMissCount, this.countSliderTickMiss + (this.statistics.miss ?? 0));
                }
            }

            this.effectiveMissCount = Math.max(this.statistics.miss ?? 0, this.effectiveMissCount);
            this.effectiveMissCount = Math.min(this.totalHits, this.effectiveMissCount);

            this.multiplier = PERFORMANCE_BASE_MULTIPLIER;

            if (Mods.hasMod(this.score.mods, "NF")) {
                this.multiplier *= Math.max(0.9, 1.0 - 0.02 * this.effectiveMissCount);
            }

            if (Mods.hasMod(this.score.mods, "SO") && this.totalHits > 0) {
                this.multiplier *= 1.0 - Math.pow(this.score.beatmap.count_spinners / this.totalHits, 0.85);
            }

            if (Mods.hasMod(this.score.mods, "RX")) {
                let okMultiplier = Math.max(0.0, this.overall_difficulty > 0 ? 1 - Math.pow(this.overall_difficulty / 13.33, 1.8) : 1);
                let mehMultiplier = Math.max(0.0, this.overall_difficulty > 0 ? 1 - Math.pow(this.overall_difficulty / 13.33, 5) : 1);

                // this.effectiveMissCount = Math.min(this.effectiveMissCount + data.countOk * okMultiplier + data.countMeh * mehMultiplier, data.totalHits);
                this.effectiveMissCount = Math.min(
                    this.effectiveMissCount +
                    (this.statistics.ok ?? 0) * okMultiplier +
                    (this.statistics.meh ?? 0) * mehMultiplier,
                    this.totalHits
                )
            }

            this.calculate();
        }


        calculate() {
            //todo
            this.speedDeviation = this.calculateSpeedDeviation();
            this.aim = this.calculateAim();
            this.speed = this.calculateSpeed();
            this.accuracy = this.calculateAccuracy();
            this.flashlight = this.calculateFlashlight();
            this.pp = this.calculateTotal();
        }

        calculateTotal() {
            let total =
                Math.pow(this.aim, 1.1) +
                Math.pow(this.speed, 1.1) +
                Math.pow(this.accuracy, 1.1) +
                Math.pow(this.flashlight, 1.1);

            total = Math.pow(total, 1 / 1.1);
            total *= this.multiplier;

            return total;
        }

        calculateAim() {
            if (Mods.hasMod(this.score.mods, "AP")) {
                return 0;
            }

            let aimDifficulty = this.score.difficulty.aim_difficulty ?? 0;

            let aim_difficult_slider_count = this.score.difficulty.aim_difficult_slider_count ?? 0;

            if (this.score.beatmap.count_sliders > 0 && aim_difficult_slider_count > 0) {
                let estimateImproperlyFollowedDifficultSliders;

                if (this.usingClassicSliderAccuracy) {
                    let maximumPossibleDroppedSliders = this.totalImperfectHits;
                    estimateImproperlyFollowedDifficultSliders = clamp(Math.min(maximumPossibleDroppedSliders, this.score.beatmap.max_combo - this.statistics.max_combo), 0, aim_difficult_slider_count);
                } else {
                    estimateImproperlyFollowedDifficultSliders = clamp(this.countSliderEndsDropped + this.countSliderTickMiss, 0, aim_difficult_slider_count);
                }

                let sliderNerfFactor = (1 - this.score.difficulty.slider_factor) * Math.pow(1 - estimateImproperlyFollowedDifficultSliders / aim_difficult_slider_count, 3) + this.score.difficulty.slider_factor;
                aimDifficulty *= sliderNerfFactor;
            }

            let aimValue = this.difficultyToPerformance(aimDifficulty);

            let lengthBonus = 0.95 + 0.4 * Math.min(1, this.totalHits / 2000.0) +
                (this.totalHits > 2000 ? Math.log10(this.totalHits / 2000.0) * 0.5 : 0.0);

            aimValue *= lengthBonus;

            if (this.effectiveMissCount) {
                aimValue *= this.calculateMissPenalty(this.effectiveMissCount, this.score.difficulty.aim_difficult_strain_count);
            }

            let approachRateFactor = 0.0;
            if (this.approach_rate > 10.33)
                approachRateFactor = 0.3 * (this.approach_rate - 10.33);
            else if (this.approach_rate < 8.0)
                approachRateFactor = 0.05 * (8.0 - this.approach_rate);

            if (Mods.hasMod(this.score.mods, "RX"))
                approachRateFactor = 0.0;

            aimValue *= 1.0 + approachRateFactor * lengthBonus;

            if (Mods.hasMod(this.score.mods, "BL"))
                aimValue *= 1.3 + (this.totalHits * (0.0016 / (1 + 2 * this.effectiveMissCount)) * Math.pow(this.statistics.accuracy, 16)) * (1 - 0.003 * this.score.difficulty.drain_rate * this.score.difficulty.drain_rate);
            else if (Mods.hasMod(this.score.mods, "HD") || Mods.hasMod(this.score.mods, "TC"))
                aimValue *= 1.0 + 0.04 * (12.0 - this.approach_rate);

            aimValue *= this.statistics.accuracy;
            aimValue *= 0.98 + Math.pow(this.overall_difficulty, 2) / 2500;

            return aimValue;
        }

        calculateSpeed() {
            if (Mods.hasMod(this.score.mods, "RX") || this.speedDeviation === null) {
                return 0;
            }

            let speedValue = this.difficultyToPerformance(this.score.difficulty.speed_difficulty);
            let lengthBonus = 0.95 + 0.4 * Math.min(1, this.totalHits / 2000.0) + (this.totalHits > 2000 ? Math.log10(this.totalHits / 2000.0) * 0.5 : 0.0);
            speedValue *= lengthBonus;

            if (this.effectiveMissCount > 0) {
                speedValue *= this.calculateMissPenalty(this.effectiveMissCount, this.score.difficulty.speed_difficult_strain_count);
            }

            let approachRateFactor = 0.0;
            if (this.approach_rate > 10.33)
                approachRateFactor = 0.3 * (this.approach_rate - 10.33);

            speedValue *= 1.0 + approachRateFactor * lengthBonus;

            if (Mods.hasMod(this.score.mods, "BL"))
                speedValue *= 1.12;
            else if (Mods.hasMod(this.score.mods, "HD") || Mods.hasMod(this.score.mods, "TC"))
                speedValue *= 1.0 + 0.04 * (12.0 - this.approach_rate);

            let speedHighDeviationMultiplier = this.calculateSpeedHighDeviationNerf();
            speedValue *= speedHighDeviationMultiplier;

            let relevantTotalDiff = this.totalHits - this.score.difficulty.speed_note_count;
            let relevantCountGreat = Math.max(0.0, (this.statistics.great ?? 0) - relevantTotalDiff);
            let relevantCountOk = Math.max(0.0, (this.statistics.ok ?? 0) - Math.max(0.0, relevantTotalDiff - (this.statistics.great ?? 0)));
            let relevantCountMeh = Math.max(0.0, (this.statistics.meh ?? 0) - Math.max(0.0, relevantTotalDiff - (this.statistics.great ?? 0) - (this.statistics.ok ?? 0)));
            let relevantAccuracy = this.score.difficulty.speed_note_count === 0.0 ? 0.0 : (
                (relevantCountGreat * 6.0 + relevantCountOk * 2.0 + relevantCountMeh * 0.5) / (this.score.difficulty.speed_note_count * 6.0)
            );

            speedValue *= (0.95 + Math.pow(this.overall_difficulty, 2) / 750.0) * Math.pow((this.statistics.accuracy + relevantAccuracy) / 2.0, (14.5 - this.overall_difficulty) * 0.5);
            return speedValue;
        }

        calculateAccuracy() {
            if (Mods.hasMod(this.score.mods, "RX")) {
                return 0;
            }

            let betterAccuracyPercentage;
            let amountHitObjectsWithAccuracy = this.score.beatmap.count_circles;
            if (!this.usingClassicSliderAccuracy)
                amountHitObjectsWithAccuracy += this.score.beatmap.count_sliders;

            if (amountHitObjectsWithAccuracy > 0)
                betterAccuracyPercentage = (((this.statistics.great ?? 0) - Math.max(this.totalHits - amountHitObjectsWithAccuracy, 0)) * 6 + (this.statistics.ok ?? 0) * 2 + (this.statistics.meh ?? 0)) / (amountHitObjectsWithAccuracy * 6);
            else
                betterAccuracyPercentage = 0;

            if (betterAccuracyPercentage < 0)
                betterAccuracyPercentage = 0;

            let accuracyValue = Math.pow(1.52163, this.overall_difficulty) * Math.pow(betterAccuracyPercentage, 24) * 2.83;
            accuracyValue *= Math.min(1.15, Math.pow(amountHitObjectsWithAccuracy * 0.001, 0.3));

            if (Mods.hasMod(this.score.mods, "BL"))
                accuracyValue *= 1.14;
            else if (Mods.hasMod(this.score.mods, "HD") || Mods.hasMod(this.score.mods, "TC"))
                accuracyValue *= 1.08;

            if (Mods.hasMod(this.score.mods, "FL"))
                accuracyValue *= 1.02;

            return accuracyValue;
        }

        calculateFlashlight() {
            if (!Mods.hasMod(this.score.mods, "FL")) {
                return 0;
            }

            let flashlightValue = (25 * Math.pow(this.score.difficulty.flashlight_difficulty ?? 0, 2));

            if (this.effectiveMissCount > 0)
                flashlightValue *= 0.97 * Math.pow(1 - Math.pow(this.effectiveMissCount / this.totalHits, 0.775), Math.pow(this.effectiveMissCount, 0.875));

            flashlightValue *= this.getComboScalingFactor();

            flashlightValue *= 0.7 + 0.1 * Math.min(1.0, this.totalHits / 200) + (this.totalHits > 200 ? 0.2 * Math.min(1.0, (this.totalHits - 200) / 200) : 0.0);

            flashlightValue *= 0.5 + this.statistics.accuracy / 2.0;
            flashlightValue *= 0.98 + Math.pow(this.overall_difficulty, 2) / 2500;

            return flashlightValue;
        }

        getComboScalingFactor() {
            return this.score.beatmap.max_combo <= 0 ? 1 : Math.min(1, Math.pow(this.statistics.max_combo, 0.8) / Math.pow(this.score.beatmap.max_combo, 0.8));
        }

        calculateMissPenalty(missCount, difficultStrainCount) {
            return 0.96 / ((missCount / (4 * Math.pow(Math.log(difficultStrainCount), 0.94))) + 1);
        }

        difficultyToPerformance(difficulty) {
            return Math.pow(5 * Math.max(1, difficulty / 0.0675) - 4, 3) / 100000;
        }

        calculateSpeedHighDeviationNerf() {
            if (this.speedDeviation === null)
                return 0.0;

            let speedValue = this.difficultyToPerformance(this.score.difficulty.speed_difficulty);

            let excessSpeedDifficultyCutoff = 100 + 220 * Math.pow(22 / this.speedDeviation, 6.5);

            if (speedValue <= excessSpeedDifficultyCutoff)
                return 1.0;

            const scale = 50;
            let adjustedSpeedValue = scale * (Math.log((speedValue - excessSpeedDifficultyCutoff) / scale + 1) + excessSpeedDifficultyCutoff / scale);

            let lerp = 1 - DifficultyCalculationUtils.ReverseLerp(this.speedDeviation, 22.0, 27.0);
            adjustedSpeedValue = DifficultyCalculationUtils.Lerp(adjustedSpeedValue, speedValue, lerp);

            return adjustedSpeedValue / speedValue;
        }

        calculateSpeedDeviation() {
            if (this.totalSuccessfulHits === 0)
                return null;

            let speedNoteCount = this.score.difficulty.speed_note_count ?? 0;
            speedNoteCount += (this.totalHits - this.score.difficulty.speed_note_count) * 0.1;

            let relevantCountMiss = Math.min(this.statistics.miss ?? 0, speedNoteCount);
            let relevantCountMeh = Math.min(this.statistics.meh ?? 0, speedNoteCount - relevantCountMiss);
            let relevantCountOk = Math.min(this.statistics.ok ?? 0, speedNoteCount - relevantCountMiss - relevantCountMeh);
            let relevantCountGreat = Math.max(0, speedNoteCount - relevantCountMiss - relevantCountMeh - relevantCountOk);

            return this.calculateDeviation(relevantCountGreat, relevantCountOk, relevantCountMeh, relevantCountMiss);
        }

        calculateDeviation(relevantCountGreat, relevantCountOk, relevantCountMeh, relevantCountMiss) {
            if (relevantCountGreat + relevantCountOk + relevantCountMeh <= 0)
                return null;

            let objectCount = relevantCountGreat + relevantCountOk + relevantCountMeh + relevantCountMiss;

            let n = Math.max(1, objectCount - relevantCountMiss - relevantCountMeh);
            const z = 2.32634787404;

            let p = relevantCountGreat / n;

            let pLowerBound = (n * p + z * z / 2) / (n + z * z) - z / (n + z * z) * Math.sqrt(n * p * (1 - p) + z * z / 4);
            let deviation = this.greatHitWindow / (Math.sqrt(2) * DifficultyCalculationUtils.ErfInv(pLowerBound));

            let randomValue = Math.sqrt(2 / Math.PI) * this.okHitWindow * Math.exp(-0.5 * Math.pow(this.okHitWindow / deviation, 2)) / (deviation * DifficultyCalculationUtils.Erf(this.okHitWindow / (Math.sqrt(2) * deviation)));

            deviation *= Math.sqrt(1 - randomValue);

            let limitValue = this.okHitWindow / Math.sqrt(3);

            if (pLowerBound === 0 || randomValue >= 1 || deviation > limitValue)
                return limitValue;

            let mehVariance = (this.mehHitWindow * this.mehHitWindow + this.okHitWindow * this.mehHitWindow + this.okHitWindow * this.okHitWindow) / 3;

            deviation = Math.sqrt(((relevantCountGreat + relevantCountOk) * Math.pow(deviation, 2) + relevantCountMeh * mehVariance) / (relevantCountGreat + relevantCountGreat + relevantCountMeh));
            return deviation;
        }
    }

    class TaikoPerformanceCalculator extends PerformanceCalculator {
        constructor(score, statistics) {
            super(score, statistics);

            this.countGreat = this.statistics.great ?? 0;
            this.countOk = this.statistics.ok ?? 0;
            this.countMeh = this.statistics.meh ?? 0;
            this.countMiss = this.statistics.miss ?? 0;
            this.totalHits = this.countGreat + this.countOk + this.countMeh + this.countMiss;
            this.totalSuccessfulHits = this.countGreat + this.countOk + this.countMeh;

            this.hitWindows = new TaikoHitWindows();
            this.hitWindows.SetDifficulty(this.score.difficulty.overall_difficulty);

            this.greatHitWindow = this.hitWindows.WindowFor(HitResult.Great) / this.clockRate;

            this.estimatedUnstableRate = this.computeDeviationUpperBound() * 10;

            if (this.totalSuccessfulHits > 0)
                this.effectiveMissCount = Math.max(1.0, 1000.0 / this.totalSuccessfulHits) * this.countMiss;

            this.isConvert = this.score.beatmap.convert;

            let multiplier = 1.13;

            if (Mods.hasMod(this.score.mods, "HD") && !this.isConvert)
                multiplier *= 1.075;

            if (Mods.hasMod(this.score.mods, "EZ"))
                multiplier *= 0.95;

            this.difficultyValue = this.computeDifficultyValue();
            this.accuracyValue = this.computeAccuracyValue();
            this.pp = Math.pow(
                Math.pow(this.difficultyValue, 1.1) +
                Math.pow(this.accuracyValue, 1.1), 1.0 / 1.1
            ) * multiplier;
        }

        computeAccuracyValue() {
            if (this.greatHitWindow <= 0 || !this.estimatedUnstableRate)
                return 0;

            let accuracyValue = Math.pow(70 / this.estimatedUnstableRate, 1.1) * Math.pow(this.score.difficulty.star_rating, 0.4) * 100;
            let lengthBonus = Math.min(1.15, Math.pow(this.totalHits.totalHits / 1500, 0.3));

            if (Mods.hasMod(this.score.mods, "FL") && Mods.hasMod(this.score.mods, "HD") && !this.isConvert)
                accuracyValue *= Math.max(1.0, 1.05 * lengthBonus);

            return accuracyValue;
        }

        computeDifficultyValue() {
            let baseDifficulty = 5 * Math.max(1.0, this.score.difficulty.star_rating / 0.110) - 4.0;
            let difficultyValue = Math.min(Math.pow(baseDifficulty, 3) / 69052.51, Math.pow(baseDifficulty, 2.25) / 1250.0);

            difficultyValue *= 1 + 0.1 * Math.max(0, this.score.difficulty.star_rating - 10);

            let lengthBonus = 1 + 0.1 * Math.min(1.0, this.totalHits / 1500.0);
            difficultyValue *= lengthBonus;

            difficultyValue *= Math.pow(0.986, this.effectiveMissCount);

            if (Mods.hasMod(this.score.mods, "EZ"))
                difficultyValue *= 0.9;

            if (Mods.hasMod(this.score.mods, "HD"))
                difficultyValue *= 1.025;

            if (Mods.hasMod(this.score.mods, "FL"))
                difficultyValue *= Math.max(1, 1.05 - Math.min(this.score.difficulty.mono_stamina_factor / 50, 1) * lengthBonus);

            if (!this.estimatedUnstableRate)
                return 0;

            let accScalingExponent = 2 + this.score.difficulty.mono_stamina_factor;
            let accScalingShift = 500 - 100 * (this.score.difficulty.mono_stamina_factor * 3);

            return difficultyValue * Math.pow(DifficultyCalculationUtils.Erf(accScalingShift / (Math.sqrt(2) * this.estimatedUnstableRate)), accScalingExponent);
        }

        computeDeviationUpperBound() {
            if (this.countGreat === 0 || this.greatHitWindow <= 0)
                return null;

            const z = 2.32634787404;
            let n = this.totalHits;
            let p = this.countGreat / n;
            let pLowerBound = (n * p + z * z / 2) / (n + z * z) - z / (n + z * z) * Math.sqrt(n * p * (1 - p) + z * z / 4);
            return this.greatHitWindow / (Math.sqrt(2) * DifficultyCalculationUtils.ErfInv(pLowerBound));
        }
    }

    class CatchPerformanceCalculator extends PerformanceCalculator {
        constructor(score, statistics) {
            super(score, statistics);

            this.num300 = this.statistics.great ?? 0;
            this.num100 = this.statistics.large_tick_hit ?? 0;
            this.num50 = this.statistics.small_tick_hit ?? 0;
            this.numKatu = this.statistics.small_tick_miss ?? 0;
            this.numMiss = (this.statistics.miss ?? 0) + (this.statistics.large_tick_miss ?? 0);

            let value = Math.pow(5.0 * Math.max(1.0, this.score.difficulty.star_rating / 0.0049) - 4.0, 2.0) / 100000.0;

            let numTotalHits = this.totalComboHits();

            let lengthBonus = 0.95 + 0.3 * Math.min(1.0, numTotalHits / 2500.0) +
                (numTotalHits > 2500 ? Math.log10(numTotalHits / 2500.0) * 0.475 : 0.0);
            value *= lengthBonus;

            value *= Math.pow(0.97, this.numMiss);

            if (this.score.difficulty.max_combo > 0)
                value *= Math.min(Math.pow(this.statistics.max_combo, 0.8) / Math.pow(this.score.difficulty.max_combo, 0.8), 1.0);

            let preempt = BeatmapDifficultyInfo.DifficultyRange(this.score.difficulty.approach_rate, 1800, 1200, 450) / this.clockRate;

            let approach_rate = preempt > 1200.0 ? -(preempt - 1800.0) / 120.0 : -(preempt - 1200.0) / 150.0 + 5.0;

            let approachRateFactor = 1.0;
            if (approach_rate > 9.0)
                approachRateFactor += 0.1 * (approach_rate - 9.0);
            if (approach_rate > 10.0)
                approachRateFactor += 0.1 * (approach_rate - 10.0);
            else if (approach_rate < 8.0)
                approachRateFactor += 0.025 * (8.0 - approach_rate);

            value *= approachRateFactor;

            if (Mods.hasMod(this.score.mods, "HD")) {
                if (approach_rate <= 10.0)
                    value *= 1.05 + 0.075 * (10.0 - approach_rate);
                else if (approach_rate > 10.0)
                    value *= 1.01 + 0.04 * (11.0 - Math.min(11.0, approach_rate));
            }

            if (Mods.hasMod(this.score.mods, "FL"))
                value *= 1.35 * lengthBonus;

            value *= Math.pow(this.accuracy(), 5.5);

            if (Mods.hasMod(this.score.mods, "NF"))
                value *= Math.max(0.9, 1.0 - 0.02 * this.numMiss);

            this.pp = value;
        }

        accuracy() {
            return this.totalHits() == 0 ? 0 : clamp(this.totalSuccessfulHits() / this.totalHits(), 0, 1);
        }

        totalSuccessfulHits() {
            return this.num50 + this.num100 + this.num300;
        }

        totalHits() {
            return this.num50 + this.num100 + this.num300 + this.numKatu + this.numMiss;

        }

        totalComboHits() {
            return this.numMiss + this.num100 + this.num300;
        }
    }

    class ManiaPerformanceCalculator extends PerformanceCalculator {
        constructor(score, statistics) {
            super(score, statistics);

            this.countPerfect = this.statistics.perfect ?? 0;
            this.countGreat = this.statistics.great ?? 0;
            this.countGood = this.statistics.good ?? 0;
            this.countOk = this.statistics.ok ?? 0;
            this.countMeh = this.statistics.meh ?? 0;
            this.countMiss = this.statistics.miss ?? 0;
            this.totalHits = this.countPerfect + this.countGreat + this.countGood + this.countOk + this.countMeh + this.countMiss;
            this.scoreAccuracy = this.calculateCustomAccuracy();

            let multiplier = 1.0;

            if (Mods.hasMod(this.score.mods, "NF"))
                multiplier *= 0.75;
            if (Mods.hasMod(this.score.mods, "EZ"))
                multiplier *= 0.5;

            let difficultyValue = this.computeDifficultyValue();
            let totalValue = difficultyValue * multiplier;
            this.pp = totalValue;
        }

        computeDifficultyValue() {
            let difficultyValue = 8.0 * Math.pow(Math.max(this.score.difficulty.star_rating - 0.15, 0.05), 2.2)
                * Math.max(0, 5 * this.scoreAccuracy - 4)
                * (1 + 0.1 * Math.min(1, this.totalHits / 1500.0));

            return difficultyValue;
        }

        calculateCustomAccuracy() {
            if (this.totalHits === 0)
                return 0;

            return (this.countPerfect * 320 + this.countGreat * 300 + this.countGood * 200 + this.countOk * 100 + this.countMeh * 50) / (this.totalHits * 320);
        }
    }

    //THIS IS SO ASS
    const erf_imp_an = [Number("0.00337916709551257388990745"), Number("-0.00073695653048167948530905"), Number("-0.374732337392919607868241"), Number("0.0817442448733587196071743"), Number("-0.0421089319936548595203468"), Number("0.0070165709512095756344528"), Number("-0.00495091255982435110337458"), Number("0.000871646599037922480317225")];
    const erf_imp_ad = [Number("1"), Number("-0.218088218087924645390535"), Number("0.412542972725442099083918"), Number("-0.0841891147873106755410271"), Number("0.0655338856400241519690695"), Number("-0.0120019604454941768171266"), Number("0.00408165558926174048329689"), Number("-0.000615900721557769691924509")];
    const erf_imp_bn = [Number("-0.0361790390718262471360258"), Number("0.292251883444882683221149"), Number("0.281447041797604512774415"), Number("0.125610208862766947294894"), Number("0.0274135028268930549240776"), Number("0.00250839672168065762786937")];
    const erf_imp_bd = [Number("1"), Number("1.8545005897903486499845"), Number("1.43575803037831418074962"), Number("0.582827658753036572454135"), Number("0.124810476932949746447682"), Number("0.0113724176546353285778481")];
    const erf_imp_cn = [Number("-0.0397876892611136856954425"), Number("0.153165212467878293257683"), Number("0.191260295600936245503129"), Number("0.10276327061989304213645"), Number("0.029637090615738836726027"), Number("0.0046093486780275489468812"), Number("0.000307607820348680180548455")];
    const erf_imp_cd = [Number("1"), Number("1.95520072987627704987886"), Number("1.64762317199384860109595"), Number("0.768238607022126250082483"), Number("0.209793185936509782784315"), Number("0.0319569316899913392596356"), Number("0.00213363160895785378615014")];
    const erf_imp_dn = [Number("-0.0300838560557949717328341"), Number("0.0538578829844454508530552"), Number("0.0726211541651914182692959"), Number("0.0367628469888049348429018"), Number("0.00964629015572527529605267"), Number("0.00133453480075291076745275"), Number("0.0000778087599782504251917881")];
    const erf_imp_dd = [Number("1"), Number("1.75967098147167528287343"), Number("1.32883571437961120556307"), Number("0.552528596508757581287907"), Number("0.133793056941332861912279"), Number("0.0179509645176280768640766"), Number("0.00104712440019937356634038"), Number("-0.0000000106640381820357337177643")];
    const erf_imp_en = [Number("-0.0117907570137227847827732"), Number("0.014262132090538809896674"), Number("0.0202234435902960820020765"), Number("0.00930668299990432009042239"), Number("0.00213357802422065994322516"), Number("0.00025022987386460102395382"), Number("0.0000120534912219588189822126")];
    const erf_imp_ed = [Number("1"), Number("1.50376225203620482047419"), Number("0.965397786204462896346934"), Number("0.339265230476796681555511"), Number("0.0689740649541569716897427"), Number("0.00771060262491768307365526"), Number("0.000371421101531069302990367")];
    const erf_imp_fn = [Number("-0.00546954795538729307482955"), Number("0.00404190278731707110245394"), Number("0.0054963369553161170521356"), Number("0.00212616472603945399437862"), Number("0.000394984014495083900689956"), Number("0.0000365565477064442377259271"), Number("0.000001354858971099323253786")];
    const erf_imp_fd = [Number("1"), Number("1.21019697773630784832251"), Number("0.620914668221143886601045"), Number("0.173038430661142762569515"), Number("0.0276550813773432047594539"), Number("0.00240625974424309709745382"), Number("0.0000891811817251336577241006"), Number("-0.0000000000465528836283382684461025")];
    const erf_imp_gn = [Number("-0.00270722535905778347999196"), Number("0.0013187563425029400461378"), Number("0.00119925933261002333923989"), Number("0.00027849619811344664248235"), Number("0.0000267822988218331849989363"), Number("0.000000923043672315028197865066")];
    const erf_imp_gd = [Number("1"), Number("0.814632808543141591118279"), Number("0.268901665856299542168425"), Number("0.0449877216103041118694989"), Number("0.00381759663320248459168994"), Number("0.000131571897888596914350697"), Number("0.0000000000404815359675764138445257")];
    const erf_imp_hn = [Number("-0.00109946720691742196814323"), Number("0.000406425442750422675169153"), Number("0.000274499489416900707787024"), Number("0.0000465293770646659383436343"), Number("0.00000320955425395767463401993"), Number("0.0000000778286018145020892261936")];
    const erf_imp_hd = [Number("1"), Number("0.588173710611846046373373"), Number("0.139363331289409746077541"), Number("0.0166329340417083678763028"), Number("0.00100023921310234908642639"), Number("0.000024254837521587225125068")];
    const erf_imp_in = [Number("-0.00056907993601094962855594"), Number("0.000169498540373762264416984"), Number("0.0000518472354581100890120501"), Number("0.00000382819312231928859704678"), Number("0.0000000824989931281894431781794")];
    const erf_imp_id = [Number("1"), Number("0.339637250051139347430323"), Number("0.043472647870310663055044"), Number("0.00248549335224637114641629"), Number("0.0000535633305337152900549536"), Number("-0.000000000000117490944405459578783846")];
    const erf_imp_jn = [Number("-0.000241313599483991337479091"), Number("0.0000574224975202501512365975"), Number("0.0000115998962927383778460557"), Number("0.000000581762134402593739370875"), Number("0.0000000853971555085673614607418")];
    const erf_imp_jd = [Number("1"), Number("0.233044138299687841018015"), Number("0.0204186940546440312625597"), Number("0.000797185647564398289151125"), Number("0.0000117019281670172327758019")];
    const erf_imp_kn = [Number("-0.000146674699277760365803642"), Number("0.0000162666552112280519955647"), Number("0.00000269116248509165239294897"), Number("0.0000000979584479468091935086972"), Number("0.00000000101994647625723465722285")];
    const erf_imp_kd = [Number("1"), Number("0.165907812944847226546036"), Number("0.0103361716191505884359634"), Number("0.000286593026373868366935721"), Number("0.0000298401570840900340874568")];
    const erf_imp_ln = [Number("-0.0000583905797629771786720406"), Number("0.0000412510325105496173512992"), Number("0.00000431790922420250949096906"), Number("0.0000000993365155590013193345569"), Number("0.0000000000653480510020104699270084")];
    const erf_imp_ld = [Number("1"), Number("0.105077086072039915406159"), Number("0.00414278428675475620830226"), Number("0.0000726338754644523769144108"), Number("0.000000477818471047398785369849")];
    const erf_imp_mn = [Number("-0.0000196457797609229579459841"), Number("0.0000157243887666800692441195"), Number("0.000000543902511192700878690335"), Number("0.000000000317472492369117710852685")];
    const erf_imp_md = [Number("1"), Number("0.052803989240957632204885"), Number("0.000926876069151753290378112"), Number("0.0000541011723226630257077328"), Number("0.000000000000535093845803642394908747")];
    const erf_imp_nn = [Number("-0.00000789224703978722689089794"), Number("0.00000622088451660986955124162"), Number("0.000000145728445676882396797184"), Number("0.0000000000603715505542715364529243")];
    const erf_imp_nd = [Number("1"), Number("0.0375328846356293715248719"), Number("0.000467919535974625308126054"), Number("0.0000000193847039275845656900547")];

    const erv_inv_imp_an = [Number("-0.000508781949658280665617"), Number("-0.00836874819741736770379"), Number("0.0334806625409744615033"), Number("-0.0126926147662974029034"), Number("-0.0365637971411762664006"), Number("0.0219878681111168899165"), Number("0.00822687874676915743155"), Number("-0.00538772965071242932965")]
    const erv_inv_imp_ad = [Number("1"), Number("-0.970005043303290640362"), Number("-1.56574558234175846809"), Number("1.56221558398423026363"), Number("0.662328840472002992063"), Number("-0.71228902341542847553"), Number("-0.0527396382340099713954"), Number("0.0795283687341571680018"), Number("-0.00233393759374190016776"), Number("0.000886216390456424707504")]
    const erv_inv_imp_bn = [Number("-0.202433508355938759655"), Number("0.105264680699391713268"), Number("8.37050328343119927838"), Number("17.6447298408374015486"), Number("-18.8510648058714251895"), Number("-44.6382324441786960818"), Number("17.445385985570866523"), Number("21.1294655448340526258"), Number("-3.67192254707729348546")]
    const erv_inv_imp_bd = [Number("1"), Number("6.24264124854247537712"), Number("3.9713437953343869095"), Number("-28.6608180499800029974"), Number("-20.1432634680485188801"), Number("48.5609213108739935468"), Number("10.8268667355460159008"), Number("-22.6436933413139721736"), Number("1.72114765761200282724")]
    const erv_inv_imp_cn = [Number("-0.131102781679951906451"), Number("-0.163794047193317060787"), Number("0.117030156341995252019"), Number("0.387079738972604337464"), Number("0.337785538912035898924"), Number("0.142869534408157156766"), Number("0.0290157910005329060432"), Number("0.00214558995388805277169"), Number("-0.000000679465575181126350155"), Number("0.000000285225331782217055858"), Number("-0.0000000681149956853776992068")]
    const erv_inv_imp_cd = [Number("1"), Number("3.46625407242567245975"), Number("5.38168345707006855425"), Number("4.77846592945843778382"), Number("2.59301921623620271374"), Number("0.848854343457902036425"), Number("0.152264338295331783612"), Number("0.01105924229346489121")]
    const erv_inv_imp_dn = [Number("-0.0350353787183177984712"), Number("-0.00222426529213447927281"), Number("0.0185573306514231072324"), Number("0.00950804701325919603619"), Number("0.00187123492819559223345"), Number("0.000157544617424960554631"), Number("0.460469890584317994083e-5"), Number("-0.230404776911882601748e-9"), Number("0.266339227425782031962e-11")]
    const erv_inv_imp_dd = [Number("1"), Number("1.3653349817554063097"), Number("0.762059164553623404043"), Number("0.220091105764131249824"), Number("0.0341589143670947727934"), Number("0.00263861676657015992959"), Number("0.764675292302794483503e-4")]
    const erv_inv_imp_en = [Number("-0.0167431005076633737133"), Number("-0.00112951438745580278863"), Number("0.00105628862152492910091"), Number("0.000209386317487588078668"), Number("0.000014962 4783758342370182"), Number("0.000000449696789927706453732"), Number("0.0000000462596163522878599135"), Number("-0.0000000281128735628831791805"), Number("0.000000000000099055709973310326855"), Number("0.00000000000000099055709973310326855")]
    const erv_inv_imp_ed = [Number("1"), Number("0.591429344886417493481"), Number("0.138151865749083321638"), Number("0.0160746087093676504695"), Number("0.000964011 807005165528527"), Number("0.275335474764726041141e-4"), Number("0.282243172016108031869e-6")]
    const erv_inv_imp_fn = [Number("-0.0024978212791898131227"), Number("-0.779190719229053954292e-5"), Number("0.254723037 413027451751e-4"), Number("0.162397777342510920873e-5"), Number("0.396341011304801168516e-7"), Number("0.411632831190944208473e-9"), Number("0.145596286718675035587e-11"), Number("-0.116765012397184275695e-17")]
    const erv_inv_imp_fd = [Number("1"), Number("0.207123112 214422517181"), Number("0.0169410838120975906478"), Number("0.000690538 265622684595676"), Number("0.145007359818232637924e-4"), Number("0.144437756628144157666e-6"), Number("0.509761276599778486139e-9")]
    const erv_inv_imp_gn = [Number("-0.000539042911019078575891"), Number("-0.28398759004727721098e-6"), Number("0.899465114892291446442e-6"), Number("0.229345859265920864296e-7"), Number("0.225561444863500149219e-9"), Number("0.947846627503022684216e-12"), Number("0.135880130108924861008e-14"), Number("-0.348890393399948882918e-21")]
    const erv_inv_imp_gd = [Number("1"), Number("0.084574623 4001899436914"), Number("0.00282092984726264681981"), Number("0.468292921 940894236786e-4"), Number("0.399968812193862100054e-6"), Number("0.161809290887904476097e-8"), Number("0.231558608310259605225e-11")]

    class DifficultyCalculationUtils {
        static Erf(x) {
            if (x == 0) return 0;
            if (x == Number.POSITIVE_INFINITY) return 1;
            if (x == Number.NEGATIVE_INFINITY) return -1;
            if (isNaN(x)) return NaN;
            return DifficultyCalculationUtils.erfImp(x, false);
        }

        static erfImp(z, invert) {
            if (z < 0) {
                if (!invert) return -this.erfImp(-z, false);
                if (z < -0.5) return 2 - this.erfImp(-z, true);
                return 1 + erfImp(-z, false);
            }
            let result;
            if (z < 0.5) {
                if (z < 1e-10) result = (z * 1.125) + (z * 0.003379167095512573896158903121545171688);
                else result = (z * 1.125) + (z * this.evaluatePolynomial(z, erf_imp_an) / this.evaluatePolynomial(z, erf_imp_ad));
            } else if (z < 110) {
                invert = !invert;
                let r, b;
                if (z < 0.75) {
                    r = this.evaluatePolynomial(z - 0.5, erf_imp_bn) / this.evaluatePolynomial(z - 0.5, erf_imp_bd);
                    b = 0.3440242112;
                } else if (z < 1.25) {
                    r = this.evaluatePolynomial(z - 0.75, erf_imp_cn) / this.evaluatePolynomial(z - 0.75, erf_imp_cd);
                    b = 0.419990927;
                }
                else if (z < 2.25) {
                    r = this.evaluatePolynomial(z - 1.25, erf_imp_dn) / this.evaluatePolynomial(z - 1.25, erf_imp_dd);
                    b = 0.4898625016;
                }
                else if (z < 3.5) {
                    r = this.evaluatePolynomial(z - 2.25, erf_imp_en) / this.evaluatePolynomial(z - 2.25, erf_imp_ed);
                    b = 0.5317370892;
                }
                else if (z < 5.25) {
                    r = this.evaluatePolynomial(z - 3.5, erf_imp_fn) / this.evaluatePolynomial(z - 3.5, erf_imp_fd);
                    b = 0.5489973426;
                }
                else if (z < 8) {
                    r = this.evaluatePolynomial(z - 5.25, erf_imp_gn) / this.evaluatePolynomial(z - 5.25, erf_imp_gd);
                    b = 0.5571740866;
                }
                else if (z < 11.5) {
                    r = this.evaluatePolynomial(z - 8, erf_imp_hn) / this.evaluatePolynomial(z - 8, erf_imp_hd);
                    b = 0.5609807968;
                }
                else if (z < 17) {
                    r = this.evaluatePolynomial(z - 11.5, erf_imp_in) / this.evaluatePolynomial(z - 11.5, erf_imp_id);
                    b = 0.5626493692;
                }
                else if (z < 24) {
                    r = this.evaluatePolynomial(z - 17, erf_imp_jn) / this.evaluatePolynomial(z - 17, erf_imp_jd);
                    b = 0.5634598136;
                }
                else if (z < 38) {
                    r = this.evaluatePolynomial(z - 24, erf_imp_kn) / this.evaluatePolynomial(z - 24, erf_imp_kd);
                    b = 0.5638477802;
                }
                else if (z < 60) {
                    r = this.evaluatePolynomial(z - 38, erf_imp_ln) / this.evaluatePolynomial(z - 38, erf_imp_ld);
                    b = 0.5640528202;
                }
                else if (z < 85) {
                    r = this.evaluatePolynomial(z - 60, erf_imp_mn) / this.evaluatePolynomial(z - 60, erf_imp_md);
                    b = 0.5641309023;
                }
                else {
                    r = this.evaluatePolynomial(z - 85, erf_imp_nn) / this.evaluatePolynomial(z - 85, erf_imp_nd);
                    b = 0.5641584396;
                }

                let g = Math.exp(-z * z) / z;
                result = (g * b) + (g * r);
            } else {
                result = 0;
                invert = !invert;
            }

            if (invert) {
                result = 1 - result;
            }

            return result;
        }

        static ErfInv(z) {
            if (z === 0) return 0;

            if (z >= 1) return Infinity;

            if (z <= -1) return -Infinity;

            let p, q, s;

            if (z < 0) {
                p = -z;
                q = 1 - p;
                s = -1;
            } else {
                p = z;
                q = 1 - z;
                s = 1;
            }

            return DifficultyCalculationUtils.ErfInvImpl(p, q, s);
        }

        static ErfInvImpl(p, q, s) {
            let result;

            if (p <= 0.5) {
                const y = 0.0891314744949340820313;
                let g = p * (p + 10);
                let r = DifficultyCalculationUtils.evaluatePolynomial(p, erv_inv_imp_an) / DifficultyCalculationUtils.evaluatePolynomial(p, erv_inv_imp_ad);
                result = (g * y) + (g * r);
            } else if (q >= 0.25) {
                const y = 2.249481201171875;
                let g = Math.sqrt(-2 * Math.log(q));
                let xs = q - 0.25;
                let r = DifficultyCalculationUtils.evaluatePolynomial(xs, erv_inv_imp_bn) / DifficultyCalculationUtils.evaluatePolynomial(xs, erv_inv_imp_bd);
                result = g / (y + r);
            } else {
                let x = Math.sqrt(-Math.log(q));
                if (x < 3) {
                    const y = 0.807220458984375;
                    let xs = x - 1.125;
                    let r = DifficultyCalculationUtils.evaluatePolynomial(xs, erv_inv_imp_cn) / DifficultyCalculationUtils.evaluatePolynomial(xs, erv_inv_imp_cd);
                    result = (y * x) + (r * x);
                } else if (x < 6) {
                    const y = 0.93995571136474609375;
                    let xs = x - 3;
                    let r = DifficultyCalculationUtils.evaluatePolynomial(xs, erv_inv_imp_dn) / DifficultyCalculationUtils.evaluatePolynomial(xs, erv_inv_imp_dd);
                    result = (y * x) + (r * x);
                } else if (x < 18) {
                    const y = 0.98362827301025390625;
                    let xs = x - 6;
                    let r = DifficultyCalculationUtils.evaluatePolynomial(xs, erv_inv_imp_en) / DifficultyCalculationUtils.evaluatePolynomial(xs, erv_inv_imp_ed);
                    result = (y * x) + (r * x);
                } else if (x < 44) {
                    const y = 0.99714565277099609375;
                    let xs = x - 18;
                    let r = DifficultyCalculationUtils.evaluatePolynomial(xs, erv_inv_imp_fn) / DifficultyCalculationUtils.evaluatePolynomial(xs, erv_inv_imp_fd);
                    result = (y * x) + (r * x);
                } else {
                    const y = 0.99941349029541015625;
                    let xs = x - 44;
                    let r = DifficultyCalculationUtils.evaluatePolynomial(xs, erv_inv_imp_gn) / DifficultyCalculationUtils.evaluatePolynomial(xs, erv_inv_imp_gd);
                    result = (y * x) + (r * x);
                }
            }

            return s * result;
        }

        static evaluatePolynomial(z, coefficients) {
            if (coefficients === undefined || coefficients.length === 0) {
                throw new Error("Coefficients array is empty");
            }

            let n = coefficients.length;

            if (n === 0) {
                return 0;
            }

            let sum = coefficients[n - 1];

            for (let i = n - 2; i >= 0; --i) {
                sum *= z;
                sum += coefficients[i];
            }

            return sum;
        }

        static ReverseLerp(x, start, end) {
            return Math.min(Math.max((x - start) / (end - start), 0.0), 1.0);
        }

        static Lerp(start, end, t) {
            return start + (end - start) * t;
        }
    }
})();
