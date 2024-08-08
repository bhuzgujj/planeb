/** @type LoggingLevel */
let logging = "error";

/**
 * Initialize the logger
 * @param {{level: LoggingLevel}}data
 */
function init(data) {
    if (data.level) {
        logging = data.level
    }
}

function debug(msg) {
    if (logging === "debug") {
        const time = new Date().toISOString()
        console.log(`(${time}) [DEBUG] ${msg}`);
    }
}

function error(msg) {
    if (logging !== "none") {
        return;
    }
    const time = new Date().toISOString()
    console.error(`(${time}) [ERROR] ${msg}`);
}

export default {
    debug,
    error,
    init
}