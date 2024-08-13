import { error } from '@sveltejs/kit';
import {getRoomsById} from "$lib/gateway.js";

export function load({ params }) {
    const room = getRoomsById(params.id)
    if (!room) {
        throw error(404, {
            message: "Room not found"
        });
    }
    return room;
}