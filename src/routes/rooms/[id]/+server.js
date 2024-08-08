import {deleteRoomById} from "$lib/database.js";
import {json} from "@sveltejs/kit";

export async function DELETE({params}) {
    deleteRoomById(params.id);
    return json({
        roomDeleted: params.id
    })
}