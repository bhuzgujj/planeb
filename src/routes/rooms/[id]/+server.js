import {deleteRoomById} from "$lib/db/database.js";
import {json} from "@sveltejs/kit";
import {updateList} from "$lib/gateway.js";

export async function DELETE({params}) {
    let roomInfo = deleteRoomById(params.id);
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