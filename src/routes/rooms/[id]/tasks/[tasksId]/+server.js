import {acceptVote, deleteTask, saveComment} from "$lib/gateway.js";
import {json} from "@sveltejs/kit";

export async function PATCH({params, request}) {
    /** @type {{cardId?: string, userId: string, comment?: string }} */
    const body = await request.json()
    if (body.cardId) {
        await acceptVote({
            roomId: params.id,
            card: body.cardId,
            tasksId: params.tasksId
        })
    } else {
        await saveComment({
            roomId: params.id,
            comment: body.comment,
            tasksId: params.tasksId
        })
    }
    return json(body)
}

export async function DELETE({params}) {
    await deleteTask(params.tasksId, params.id)
    return json({
        roomId: params.id,
        tasksId: params.tasksId
    })
}