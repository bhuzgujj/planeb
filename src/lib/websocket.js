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
        socket.on("connection", (ws, req) => {
            const ip = req.socket.remoteAddress;
            connectionsPool.set(ip, {
                socket: ws,
                focused: null,
                listed: false
            })
            logger.debug(`Connection from ${ip}`)
            ws.on("message", onMessage(ip))
            ws.on("close", onClose(ip))
            ws.on("error", onErr(ip))
        })
        resolve()
    })
}

function onMessage(ip) {
    return (data) => {
        const item = JSON.parse(data)
        logger.debug(`Message received from ${ip} ${data}`)
        if (item.focused) {
            connectionsPool.get(ip).focused = item.focused
        }
        if (item.listed !== undefined || item.listed !== null) {
            connectionsPool.get(ip).listed = item.listed
        }
    }
}

function onClose(ip) {
    return (data) => {
        logger.debug(`Closing socket for ip ${ip}`);
        connectionsPool.delete(ip)
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
