import fs from "fs";

/**
 * @typedef {import('$lib/data.d.ts').Query} Query
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

export const queries = {
    readQuery,
    readMigration
}