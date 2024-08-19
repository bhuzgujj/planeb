import {acceptVote, deleteTask} from "$lib/gateway.js";
import {json} from "@sveltejs/kit";

export async function PATCH({params, request}) {
    /** @type {{cardId: string, userId: string }} */
    const body = await request.json()
    await acceptVote({
        roomId: params.id,
        card: body.cardId,
        tasksId: params.tasksId
    })
    return json(body)
}

export async function DELETE({params}) {
    await deleteTask(params.tasksId, params.id)
    return json({
        roomId: params.id,
        tasksId: params.tasksId
    })
}