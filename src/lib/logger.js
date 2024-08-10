/**
 * @typedef { "error" | "info" | "warn" | "debug" | "none"} LoggingLevel
 * @typedef {{ level?: LoggingLevel, showOrigin?: boolean }} LoggerConfig
 * @typedef {(config: LoggerConfig) => void} Initializer
 */

/** @type number */
let logging = 1;
/** @type boolean */
let showOrigin = false;
/** @type {(msg: any, lvl: number) => void} */
let logs = (msg, lvl) => {
    if (lvl < 2) {
        console.error(msg)
    } else {
        console.log(msg);
    }
}

/** @type {Map<LoggingLevel, Number>} */
const levels = new Map()
levels.set("none", 0);
levels.set("error", 1);
levels.set("warn", 2);
levels.set("info", 3);
levels.set("debug", 4);

/**
 * Initialize the logger
 * @param {LoggerConfig} config
 */
function init(config) {
    if (config.level) {
        logging = levels.get(config.level) ?? 1
    }
    if (config.showOrigin) {
        showOrigin = config.showOrigin
    }
}

/**
 * Log a message for a specific level
 * @param {any} msg
 * @param {LoggingLevel} lvl
 */
function log(msg, lvl) {
    let loggedLevel = levels.get(lvl);
    if (!loggedLevel) {
        console.error("No log level found for " + lvl);
        return
    }
    if (logging >= loggedLevel) {
        let message;
        if (typeof msg === 'string') {
            message = msg;
        } else {
            message = JSON.stringify(msg)
        }
        const time = new Date().toISOString()
        if (showOrigin) {
            let path = (new Error()).stack?.split("\n")[3]?.trim()
            if (path) {
                path = path.split("(")[1].split(")")[0]
            }
            logs(`(${time}) [${lvl}] ${path}: ${message}`, loggedLevel);
        } else {
            logs(`(${time}) [${lvl}] ${message}`, loggedLevel);
        }
    }
}

/**
 * @type {{
 *     init: Initializer,
 *     log: (msg: any, level: LoggingLevel) => void,
 *     none: (msg: any) => void,
 *     error: (msg: any) => void,
 *     warn: (msg: any) => void,
 *     info: (msg: any) => void,
 *     debug: (msg: any) => void,
 * }}
 */
export default {
    init,
    log: (msg, lvl) => log(msg, lvl),
    none: (msg) => log(msg, "none"),
    error: (msg) => log(msg, "error"),
    warn: (msg) => log(msg, "warn"),
    info: (msg) => log(msg, "info"),
    debug: (msg) => log(msg, "debug"),
}