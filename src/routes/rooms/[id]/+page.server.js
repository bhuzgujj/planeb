import { error } from '@sveltejs/kit';
import {getRoomsById} from "$lib/database.js";

export function load({ params }) {
    let room = getRoomsById(params.id)
    if (!room) {
        throw error(404, {
            message: "Room not found"
        });
    }
    return room;
}