import {votes} from "$lib/gateway.js";
import {json} from "@sveltejs/kit";

export async function PATCH({params, request}) {
    /** @type {{cardId: string, userId: string }} */
    const body = await request.json()
    await votes({
        roomId: params.id,
        card: body.cardId,
        userId: params.userId,
        tasksId: params.tasksId
    })
    return json(body)
}