import {readable, writable} from "svelte/store";

export const rooms = readable([], function (set) {
    const roomMap = new Map();
    set(roomMap)
    const socket = new WebSocket("ws://localhost:43594", "roomList");

    socket.onmessage = function (event) {
        if (event.data.type === "removed") {
            for (const item of event.data.items) {
                roomMap.delete(item.id)
            }
        } else {
            for (const item of event.data.items) {
                roomMap.set(item.id, item.data)
            }
        }

        set(roomMap)
    }

    return function stop() {
        socket.close(0, "disconnection")
    }
})