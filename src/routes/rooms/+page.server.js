import {getRooms} from "$lib/database.js";

export function load(props) {
    return {
        rooms: getRooms()
    };
}