import {deleteRoomById} from "$lib/database.js";
import {json} from "@sveltejs/kit";
import {updateList} from "$lib/websocket.js";

export async function DELETE({params}) {
    deleteRoomById(params.id);
    updateList({
        id: params.id,
        type: "remove",
        room: null
    }, "list")
    return json({
        roomDeleted: params.id
    })
}