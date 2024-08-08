/**
 * @typedef {{
 *     name: string;
 *     isPersisted: boolean;
 * }} RoomInfo
 * @typedef {{
 *     type: UpdateType,
 *     id: string,
 *     room: RoomInfo | null
 * }} ListEvent
 * @typedef {{
 *     type: UpdateType,
 *     id: string,
 *     room: RoomInfo
 * }} RoomEvent
 * @typedef {"list" | "room"} ListenerType
 * @typedef {"add" | "update" | "remove"} UpdateType
 */

/** @type {WebSocket | null} */
let socket;
/** @type {Array<{listener: (evt: ListEvent | RoomEvent) => void, type: ListenerType}>} */
let listeners = []

export function init() {
    if (socket) return
    socket = new WebSocket("ws://localhost:43594/");
    socket.onopen = () => {
        if (!socket)
            throw new Error("WebSocket not initialized");
        console.log("Socket opened");
        socket.onmessage = (event) => {
            console.log(`Received from websocket: ${event.data}`);
            let events = JSON.parse(event.data);
            for (const l of listeners) {
                if (events.type === l.type) {
                    l.listener(events.update);
                }
            }
        }

        socket.send(JSON.stringify({
            listed: true,
        }))
    }
}

/**
 *
 * @param {(evt: ListEvent | RoomEvent) => void} listener
 * @param {ListenerType} type
 */
export function listenToUpdate(listener, type) {
    listeners.push({listener, type})
}

/**
 *
 * @param {(evt: ListEvent | RoomEvent) => void} listener
 */
export function stopListening(listener) {
    listeners = listeners.filter((l) => l.listener !== listener)
}
