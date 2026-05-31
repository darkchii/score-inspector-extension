import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

export default defineConfig({
    build: {
        sourcemap: true,
    },

    plugins: [
        monkey({
            entry: "src/main.ts",

            userscript: {
                name: "scores inspector extension",
                version: "2.0.0",

                match: [
                    "https://osu.ppy.sh/*"
                ],

                grant: [
                    "GM_getValue",
                    "GM.getValue",
                    "GM_setValue",
                    "GM.setValue",
                    "GM_addStyle",
                    "GM.addStyle",
                    "window.onurlchange"
                ]
            }
        })
    ]
});