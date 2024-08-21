import {deleteRoomById} from "$lib/db/database.js";
import {json} from "@sveltejs/kit";
import {updateList, moderation} from "$lib/gateway.js";

export async function DELETE({params, request}) {
    const body = request.json()
    let roomInfo = deleteRoomById(params.id, body.userId);
    if (!roomInfo)
        return json({message: "Room not found"}, {
            status: 404
        });
    updateList({
        id: params.id,
        action: "remove",
        evt: roomInfo
    }, "list")
    return json({
        roomDeleted: params.id
    })
}

export async function PATCH({params, request}) {
    /** @type {{ userId: string, moderator: boolean, targetId: string }} */
    const body = await request.json()
    const response = await moderation({
        userId: body.userId,
        targetId: body.targetId,
        moderator: body.moderator,
        roomId: params.id
    })
    if (response) {
        return json(body)
    } else {
        return json({ message: "Forbidden" }, {status: 403})
    }
}