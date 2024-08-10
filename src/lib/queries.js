import fs from "fs";

/**
 * @typedef {"init" | "create_room"} Query
 */

/**
 * Get a query as a string from premade queries
 * @param {Query} name
 * @return {string}
 */
function readQuery(name) {
    return fs.readFileSync(`./resources/queries/${name}.sql`, "utf-8")
}


/**
 * Get a query as a string from premade migration
 * @param {string} name
 * @return {string}
 */
function readMigration(name) {
    return fs.readFileSync(`./resources/migrations/${name}.sql`, "utf-8")
}

export let queries = {
    readQuery,
    readMigration
}