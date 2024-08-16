/**
 * @typedef {import('$lib/data.d.ts').RoomInfo} RoomInfo
 *
 * @typedef {import('$lib/network.d.ts').CrudAction} UpdateType
 * @typedef {import('$lib/network.d.ts').ListEvent} ListEvent
 * @typedef {import('$lib/network.d.ts').ListenerType} ListenerType
 *
 * @typedef {import('$lib/network.d.ts').NetCallback} NetCallback
 */

/** @type {WebSocket | null} */
let socket;
/** @type {Array<{listener: NetCallback, type: ListenerType}>} */
let listeners = []
let retries = 0;
let logging = false;

/**
 *
 * @param {boolean} shouldLog
 */
function init(shouldLog) {
    logging = shouldLog;
    if (socket || retries > 3) {
        return
    }
    retries++
    socket = new WebSocket("ws://localhost:43594/");
    socket.onopen = () => {
        if (!socket)
            throw new Error("WebSocket not initialized");
        socket.onmessage = (event) => {
            if (logging)
                console.log(`Received from websocket: ${event.data}`);
            let events = JSON.parse(event.data);
            for (const l of listeners) {
                if (events.type === l.type) {
                    l.listener(events.update);
                }
            }
        }
        socket.onclose = () => {
            socket = null
            init(shouldLog)
        }
        socket.onerror = (err) => {
            console.error(err)
        }
    }
}

/**
 @template {ListenerType} T
 * @param {NetCallback} listener
 * @param {import('$lib/network.d.ts').WebSocketRegisteringEvent<T>} subMsg
 */
function listenToUpdate(listener, subMsg) {
    listeners.push({listener, type: subMsg.type})

    if (socket) {
        socket.send(JSON.stringify(subMsg))
    }
}

/**
 * @template {ListenerType} T
 * @param {NetCallback} listener
 * @param {import('$lib/network.d.ts').WebSocketRegisteringEvent<T>} subMsg
 */
function stopListening(listener, subMsg) {
    listeners = listeners.filter((l) => l.listener !== listener)

    if (socket) {
        socket.send(JSON.stringify(subMsg))
    }
}

function send(data, type) {
    socket.send(JSON.stringify({ type, data }))
}

export default {
    init,
    listenToUpdate,
    stopListening,
    send
}