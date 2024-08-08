import { error } from '@sveltejs/kit';
import {getRoomsById, getRooms} from "$lib/database.js";

export function load({ params }) {
    let room = getRoomsById(params.id)
    if (!room) {
        throw error(404, { msg: "Room not found" });
    }
    return room;
}