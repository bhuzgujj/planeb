import fs from "fs";

fs.rmdirSync("./node_modules", {recursive: true});
fs.rmdirSync("./databases", {recursive: true});
fs.rmdirSync("./build", {recursive: true});
fs.rmdirSync("./.svelte-kit", {recursive: true});