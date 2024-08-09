/**
 * @typedef {import('$lib/data.d.ts').ListInfo} RoomInfo
 *
 * @typedef {import('$lib/network.d.ts').CrudAction} UpdateType
 * @typedef {import('$lib/network.d.ts').ListEvent} ListEvent
 * @typedef {import('$lib/network.d.ts').RoomModificationEvent} RoomModificationEvent
 * @typedef {import('$lib/network.d.ts').ListenerType} ListenerType
 *
 * @typedef {((evt: ListEvent) => void) | ((evt: RoomModificationEvent) => void)} NetCallback
 * @typedef {{listed?: boolean, focused?: string, type: ListenerType}} SubscribeMessage
 */

/** @type {WebSocket | null} */
let socket;
/** @type {Array<{listener: NetCallback, type: ListenerType}>} */
let listeners = []

function init() {
    if (socket) {
        return
    }
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
    }
}

/**
 * @param {NetCallback} listener
 * @param {SubscribeMessage} subMsg
 */
function listenToUpdate(listener, subMsg) {
    listeners.push({listener, type: subMsg.type})

    if (socket) {
        socket.send(JSON.stringify(subMsg))
    }
}

/**
 * @param {NetCallback} listener
 * @param {SubscribeMessage} subMsg
 */
function stopListening(listener, subMsg) {
    listeners = listeners.filter((l) => l.listener !== listener)

    if (socket) {
        socket.send(JSON.stringify(subMsg))
    }
}

export default {
    init,
    listenToUpdate,
    stopListening,
}