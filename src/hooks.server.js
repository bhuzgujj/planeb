import * as db from "$lib/db/database.js";
import {DATABASE, DATABASE_FOLDER} from "$env/static/private";
import websocket from "$lib/net/websocket.js";
import {initialize} from "$lib/gateway.js";

let started = false;

function start() {
    if (started) {
        return
    }
    started = true;
    initialize({
        logging: {
            level: "debug",
            showOrigin: true
        },
        database: {
            folder: DATABASE_FOLDER,
            roomSubFolder: "rooms",
            masterDbNames: DATABASE
        }
    })
    websocket.init()
    process.on('sveltekit:shutdown', async (reason) => {await shutdown() })
    process.on('SIGINT', async (reason) => { await shutdown(); });
    process.on('SIGTERM', async (reason) => { await shutdown(); });
}

async function shutdown(){
    await db.cleanup();
    await websocket.close()
}

start();