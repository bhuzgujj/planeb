import {WebSocketServer} from "ws";
import logger from "$lib/logger.js";

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

/** @type {WebSocketServer | null} */
let socket = null;
/** @type {Map<string, {socket: any, focused: Array<string>, listed: boolean}>} */
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
        if (!socket)
            throw new Error("WebSocket not initialized");
        try {
            socket.on("connection", (ws, req) => {
                const id = crypto.randomUUID();
                connectionsPool.set(id, {
                    socket: ws,
                    focused: [],
                    listed: false
                })
                logger.debug(`Connection from ${ req.socket.remoteAddress}`)
                ws.on("message", onMessage(id))
                ws.on("close", onClose(id))
                ws.on("error", onError(id))
            })
            resolve("Websocket initialized")

        } catch (e) {
            reject(e)
        }
    })
        .then(logger.debug)
        .catch(logger.error)
}

/**
 * When receiving a message, execute this
 * @param {string} id
 * @return {(data: any) => void}
 */
function onMessage(id) {
    return (data) => {
        const connection = connectionsPool.get(id)
        if (!connection) {
            return
        }
        const item = JSON.parse(data)
        logger.debug(`Message received from ${id} ${data}`)
        if (item.focused) {
            connection.focused = item.focused
        }
        if (item.listed !== undefined || item.listed !== null) {
            connection.listed = item.listed
        }
    }
}

/**
 * If a socket closes, it execute this function
 * @param {string} id
 * @return {(data: any) => void}
 */
function onClose(id) {
    return (data) => {
        logger.debug(`Closing socket for ip ${id}`);
        connectionsPool.delete(id)
    }
}

/**
 * If a socket error, it execute this function
 * @param {string} id
 * @return {(data: any) => void}
 */
function onError(id) {
    return (data) => {
        logger.error(data)
    }
}

/**
 *
 * @param {ListEvent | RoomEvent} evt
 * @param {ListenerType} type
 */
export function updateList(evt, type) {
    logger.debug(`Broadcasting to WebSocket: ${JSON.stringify(evt)}`)
    for (const [ip, connection] of connectionsPool.entries()) {
        switch (type) {
            case "list":
                if (connection.listed) {
                    logger.debug(`Sending to ${ip}`)
                    connection.socket.send(JSON.stringify({
                        type,
                        update: evt
                    }))
                }
                break
            case "room":
                if (connection.focused.includes(evt.id)) {

                }
                break
        }
    }
}

function close() {
    for (const connection of connectionsPool.values())
        connection.socket.close()
    socket?.close(() => {
        socket = null
    })
}

export default {
    init,
    close
}
