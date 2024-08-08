import {deleteRoomById, getRooms} from "$lib/database.js";
import {fail} from "@sveltejs/kit";

export function load(props) {
    return {
        rooms: getRooms()
    };
}


export const actions = {
    deleteRoom: async ({cookies, params}) => {
        if (!params.roomId) {
            return fail(404, { msg: "Room not found." });
        } else {
            await deleteRoomById(params.roomId);
        }
    }
}