import * as db from "$lib/database.js";
import {DATABASE, DATABASE_FOLDER} from "$env/static/private";
import logger from "$lib/logger.js";
import websocket from "$lib/websocket.js";

let started = false;

function start() {
    if (started) {
        return
    }
    started = true;

    logger.init({ level: "debug", showOrigin: true })
    db.init(DATABASE_FOLDER, "rooms", DATABASE);
    websocket.init()
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

function shutdown(){
    db.cleanup();
    websocket.close()
}

start();