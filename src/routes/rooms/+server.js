import {json} from "@sveltejs/kit";
import {createRoom, updateList} from "$lib/gateway.js";
/**
 * @typedef {import("$lib/logger.js").default}
 */
import logger from "$lib/logger.js";

export async function POST({request}) {
    const body = await request.json()
    logger.debug(`Adding new room ${JSON.stringify({
        name: body.name, 
        persisted: body.persisted, 
        moderator: body.moderator,
        cards: body.cards,
        taskPrefix: body.taskPrefix
    })}`);
    let id = await createRoom(body.name, body.persisted, body.moderator, body.cards, body.taskPrefix);
    updateList({
        action: "add",
        id,
        evt: {
            name: body.name,
            isPersisted: body.persisted,
            owner: body.moderator.id,
            taskRegex: body.taskPrefix
        }
    }, "list")
    return json({
        created: id
    })
}