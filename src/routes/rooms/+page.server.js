import {getRooms} from "$lib/gateway.js";

export function load(props) {
    return {
        rooms: getRooms()
    };
}