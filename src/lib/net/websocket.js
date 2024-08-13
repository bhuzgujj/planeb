import {WebSocketServer} from "ws";
import logger from "$lib/logger.js";
import {putUserInRoom} from "$lib/db/database.js";

/**
 * @typedef {import('$lib/network.d.ts').CrudAction} UpdateType
 * @typedef {import('$lib/data.d.ts').ListInfo} RoomInfo
 * @typedef {import('$lib/network.d.ts').SetsEvent} SetsEvent
 * @typedef {import('$lib/network.d.ts').ListEvent} ListEvent
 * @typedef {import('$lib/network.d.ts').RoomModificationEvent} RoomEvent
 * @typedef {import('$lib/network.d.ts').ListenerType} ListenerType
 * @typedef {{socket: any, userId: string | undefined, focused: Set<string>, listed: boolean, setted: boolean}} ConnectionItem
 * @typedef {Map<string, ConnectionItem>} ConnectionPool
 */

/** @type {WebSocketServer | null} */
let socket = null;
/** @type {ConnectionPool}>} */
const connectionsPool = new Map();

function init() {
    if (socket) {
        return
    }
    logger.debug("Initializing websocket...")
    socket = new WebSocketServer({
        port: 43594
    })
    /** @type {Promise<void>} */
    const creation = new Promise((resolve, reject) => {
        if (!socket)
            throw new Error("WebSocket not initialized");
        try {
            socket.on("connection", (ws, req) => {
                const id = crypto.randomUUID();
                connectionsPool.set(id, {
                    socket: ws,
                    userId: undefined,
                    focused: new Set(),
                    listed: false,
                    setted: false,
                })
                logger.debug(`Connection from ${ req.socket.remoteAddress}`)
                ws.on("message", onMessage(id))
                ws.on("close", onClose(id))
                ws.on("error", onError(id))
            })
            logger.debug("Websocket initialized")
            resolve()

        } catch (e) {
            reject(e)
        }
    })
    creation.catch(logger.error)
}

/**
 * When receiving a message, execute this
 * @param {string} id
 * @return {(data: string) => void}
 */
function onMessage(id) {
    return (data) => {
        /** @type {ConnectionItem | undefined} */
        const connection = connectionsPool.get(id)
        if (connection === undefined) {
            return
        }
        /** @type {import("$lib/network.js").WebSocketRequest} */
        const item = JSON.parse(data)
        logger.debug(`Message received from ${id} ${data}`)
        if (item.focused?.id !== item.unfocused) {
            if (item.focused) {
                if (!connection.focused.has(item.focused.id)) {
                    putUserInRoom({
                        id: item.focused.user.id,
                        names: item.focused.user.name
                    }, item.focused.id)
                        .then(() => {
                            if (item.focused?.id) {
                                connection.focused.add(item.focused?.id)
                            }
                        })
                        .catch(logger.error)
                }
            }
            if (item.unfocused) {
                connection.focused.delete(item.unfocused)
            }
        }
        if (item.listed !== undefined) {
            connection.listed = item.listed
        }
        if (item.setted !== undefined) {
            connection.setted = item.setted
        }
        if (item.userId !== undefined) {
            connection.userId = item.userId
        }
    }
}

/**
 * If a socket closes, it executes this function
 * @param {string} id
 * @return {(data: string) => void}
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
 * @return {(data: string) => void}
 */
function onError(id) {
    return (data) => {
        logger.error(data)
    }
}

/**
 *
 * @param {string} id
 * @param {string} name
 */
export async function changeName(id, name) {
    /** @type {Set<string>} */
    let roomSubscribed = new Set();
    for (const connection of connectionsPool.values()) {
        if (connection.userId === id) {
            roomSubscribed = connection.focused
            break;
        }
    }
    if (roomSubscribed.size < 1) {
        logger.warn("No room subed for userid: " + id)
        return;
    }
    let executions = [];
    for (const roomId of roomSubscribed.values()) {
        executions.push(putUserInRoom({id, names: name}, roomId))
    }
    return Promise.all(executions)
        .then(() => {
            for (const connection of connectionsPool.values()) {
                for (const roomId of roomSubscribed.values()) {
                    if (connection.focused.has(roomId)) {
                        const msg = {
                            type: "user",
                            update: {
                                id,
                                evt: {
                                    name
                                }
                            }
                        }
                        connection.socket.send(JSON.stringify(msg))
                        break;
                    }
                }
            }
        })
        .catch(e => logger.error("Error mid promises: " + e))
}

/**
 *
 * @param {ListEvent | RoomEvent | SetsEvent} evt
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
            case "sets":
                if (connection.setted) {
                    logger.debug(`Sending to ${ip}`)
                    connection.socket.send(JSON.stringify({
                        type,
                        update: evt
                    }))
                }
                break
            default:
                logger.debug(`Recieved ${type}: ${evt}`)
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
