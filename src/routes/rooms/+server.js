import {json} from "@sveltejs/kit";
import {createRoom} from "$lib/database.js";
import {updateList} from "$lib/websocket.js";
import logger from "$lib/logger.js";

export async function POST({request}) {
    const body = await request.json()
    logger.debug(`Adding new room ${JSON.stringify({name: body.name, persisted: body.persisted})}`);
    let id = await createRoom(body.name, body.persisted);
    updateList({
        type: "add",
        id,
        room: {
            name: body.name,
            isPersisted: body.persisted
        }
    }, "list")
    return json({
        created: id
    })
}