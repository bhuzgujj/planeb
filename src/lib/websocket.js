import {WebSocketServer} from "ws";
import logger from "$lib/logger.js";

let socket = null;
/** @type {Map<string, {socket: any, focused: string | null, listed: boolean}>} */
const connectionsPool = new Map();

function init() {
    logger.debug("Initializing websocket...")
    if (socket != null) {
        return
    }
    socket = new WebSocketServer({
        port: 43594
    })
    new Promise((resolve, reject) => {
        try {
            socket.on("connection", (ws, req) => {
                const id = crypto.randomUUID();
                connectionsPool.set(id, {
                    socket: ws,
                    focused: null,
                    listed: false
                })
                logger.debug(`Connection from ${ req.socket.remoteAddress}`)
                ws.on("message", onMessage(id))
                ws.on("close", onClose(id))
                ws.on("error", onErr(id))
            })
            resolve("Websocket initialized")

        } catch (e) {
            reject(e)
        }
    })
        .then(logger.debug)
        .catch(logger.error)
}

function onMessage(id) {
    return (data) => {
        const item = JSON.parse(data)
        logger.debug(`Message received from ${id} ${data}`)
        if (item.focused) {
            connectionsPool.get(id).focused = item.focused
        }
        if (item.listed !== undefined || item.listed !== null) {
            connectionsPool.get(id).listed = item.listed
        }
    }
}

function onClose(id) {
    return (data) => {
        logger.debug(`Closing socket for ip ${id}`);
        connectionsPool.delete(id)
    }
}

function onErr(ip) {
    return (data) => {
        logger.error(data)
    }
}

/**
 *
 * @param {ListEvent | RoomEvent} listEvent
 * @param {ListenerType} type
 */
export function updateList(listEvent, type) {
    logger.debug(`Broadcasting to WebSocket: ${JSON.stringify(listEvent)}`)
    for (const [ip, connection] of connectionsPool.entries()) {
        if (connection.listed) {
            logger.debug(`Sending to ${ip}`)
            connection.socket.send(JSON.stringify({
                type,
                update: listEvent
            }))
        }
    }
}

function close() {
    socket.close()
}

export default {
    init,
    close
}
