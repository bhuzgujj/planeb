import {acceptVote, deleteTask, saveComment} from "$lib/gateway.js";
import {json} from "@sveltejs/kit";

export async function PATCH({params, request}) {
    /** @type {{cardId?: string, userId: string, comment?: string }} */
    const body = await request.json()
    let resp;
    if (body.cardId) {
        resp = await acceptVote({
            roomId: params.id,
            card: body.cardId,
            tasksId: params.tasksId,
        }, body.userId)
    } else {
        resp = await saveComment({
            roomId: params.id,
            comment: body.comment,
            tasksId: params.tasksId
        }, body.userId)
    }
    if (resp) {
        return json(body)
    } else {
        return json({ message: "Forbidden" }, {status: 403})
    }
}

export async function DELETE({params, request}) {
    const body = await request.json()
    const response = await deleteTask(params.tasksId, params.id, body.userId)
    if (response) {
        return json({
            roomId: params.id,
            userId: body.userId,
            tasksId: params.tasksId
        })
    } else {
        return json({ message: "Forbidden" }, {status: 403})
    }
}