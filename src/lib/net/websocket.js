import {WebSocketServer} from "ws";
import logger from "$lib/logger.js";
import {addUserToRoom} from "$lib/gateway.js";

/**
 * @typedef {import('$lib/network.d.ts').CrudAction} UpdateType
 * @typedef {import('$lib/data.d.ts').RoomInfo} RoomInfo
 * @typedef {import('$lib/network.d.ts').EventTypes} EventTypes
 * @typedef {import('$lib/network.d.ts').SetsEvent} SetsEvent
 * @typedef {import('$lib/network.d.ts').ListEvent} ListEvent
 * @typedef {import('$lib/network.d.ts').RoomEvent} RoomEvent
 * @typedef {import('$lib/network.d.ts').ListenerType} ListenerType
 * @typedef {{socket: any, userId: string | null, focused: Set<string>, listed: boolean, tasks: boolean, setted: boolean}} ConnectionItem
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
                    userId: null,
                    focused: new Set(),
                    listed: false,
                    setted: false,
                    tasks: false,
                })
                logger.debug(`Connection from ${req.socket.remoteAddress}`)
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
        logger.debug(`Message received from ${id} ${data}`)
        /** @type {ConnectionItem | undefined} */
        const connection = connectionsPool.get(id)
        if (connection === undefined) {
            return
        }
        /**
         * @template {ListenerType} T
         * @type {import("$lib/network.js").WebSocketRegisteringEvent<T>}
         */
        const item = JSON.parse(data)
        /** @type {any} */
        const evt = item.data
        switch (item.type) {
            case "list":
                /** @type {import("$lib/network.js").EventData<"list">} */
                connection.listed = evt
                break;
            case "room":
                /** @type {import("$lib/network.js").EventData<"room">} */
                const room = evt
                if (room.action === "remove") {
                    connection.focused.delete(room.roomId)
                } else if (room.user) {
                    const roomIds = new Set()
                    roomIds.add(room.roomId)
                    addUserToRoom(roomIds, item.userId, room.user.name)
                        .then(() => connection.focused.add(room.roomId))
                        .catch(logger.error)
                } else {
                    logger.warn("Cannot add or modify an non existing user")
                }
                break;
            case "sets":
                /** @type {import("$lib/network.js").EventData<"sets">} */
                connection.setted = evt
                break;
            case "tasks":
                /** @type {import("$lib/network.js").EventData<"tasks">} */
                connection.tasks = evt
                break;
        }
        connection.userId = item.userId
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
        logger.warn(data)
    }
}

/**
 *
 * @param {string} id
 */
export function getSubscribedRoom(id) {
    let roomSubscribed = new Set();
    for (const connection of connectionsPool.values()) {
        if (connection.userId === id) {
            roomSubscribed = connection.focused
            break;
        }
    }
    return roomSubscribed;
}

/**à
 * @param {EventTypes} evt
 * @param {ListenerType} type
 * @param {Set<string>} roomSubscribed
 */
export function notify(evt, type, roomSubscribed) {
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
            case "tasks":
                if (connection.tasks) {
                    logger.debug(`Sending to ${ip}`)
                    connection.socket.send(JSON.stringify({
                        type,
                        update: evt
                    }))
                }
                break
            case "room":
                for (const connection of connectionsPool.values()) {
                    for (const roomId of roomSubscribed.values()) {
                        if (connection.focused.has(roomId)) {
                            logger.debug(`Sending to ${ip}`)
                            connection.socket.send(JSON.stringify({
                                type,
                                update: evt
                            }))
                            break;
                        }
                    }
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
