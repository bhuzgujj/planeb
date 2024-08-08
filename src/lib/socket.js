let socket;
/** @type {Array<{listener: EventListener<ListEvent | RoomEvent>, type: ListenerType}>} */
let listeners = []

export function init() {
    if (socket) return
    socket = new WebSocket("ws://localhost:43594/");
    socket.onopen = () => {
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
 * @param {EventListener<ListEvent | RoomEvent>} listener
 * @param {ListenerType} type
 */
export function listenToUpdate(listener, type) {
    listeners.push({listener, type})
}

/**
 *
 * @param {EventListener<ListEvent | RoomEvent>} listener
 */
export function stopListening(listener) {
    listeners = listeners.filter((l) => l.listener !== listener)
}
