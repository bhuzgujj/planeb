import {WebSocketServer} from "ws";
import logger from "$lib/logger.js";
import {addUserToRoom} from "$lib/gateway.js";
import {queries} from "$lib/db/queries.js";
import {createId} from "../../idGenerator.js";
import {createDb} from "$lib/db/database.js";

/**
 * @typedef {import('$lib/network.d.ts').CrudAction} UpdateType
 * @typedef {import('$lib/data.d.ts').RoomInfo} RoomInfo
 * @typedef {import('$lib/network.d.ts').EventTypes} EventTypes
 * @typedef {import('$lib/network.d.ts').SetsEvent} SetsEvent
 * @typedef {import('$lib/network.d.ts').ListEvent} ListEvent
 * @typedef {import('$lib/network.d.ts').RoomEvent} RoomEvent
 * @typedef {import('$lib/network.d.ts').ListenerType} ListenerType
 * @typedef {import('$lib/network.d.ts').MessageType} MessageType
 */

/** @type {WebSocketServer | null} */
let socket = null;

/** @type {Map<string, {socket: any, ip: string}>} */
const connectionPool = new Map();

const cache = createDb(":memory:")

function init() {
    if (socket) {
        return
    }
    logger.debug("Initializing websocket...")
    socket = new WebSocketServer({
        port: 43594
    })
    cache.exec(queries.readQuery("connections"))
    /** @type {Promise<void>} */
    const creation = new Promise((resolve, reject) => {
        if (!socket)
            throw new Error("WebSocket not initialized");
        try {
            socket.on("connection", (ws, req) => {
                const id = createId();
                cache.prepare("insert into connections (id) values (?)").run(id)
                connectionPool.set(id, {socket: ws, ip: req.socket.remoteAddress})
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
 * Verify if the connection id is attributed to the userId
 * @param connectionId
 * @param userId
 * @return {boolean}
 */
function userIsValid(connectionId, userId) {
    const conn = cache.prepare("select * from connections where users_id = ?").all(userId);
    if (conn.length !== 1)
        return true;
    return conn[0].id === connectionId
}

/**
 * When receiving a message, execute this
 * @param {string} id
 * @return {(data: string) => void}
 */
function onMessage(id) {
    return (msg) => {
        logger.debug(`Message received from ${id} ${msg}`)
        /**
         * @template {ListenerType | MessageType} T
         * @type {import("$lib/network.js").WebSocketMessageEvent<T>}
         */
        const item = JSON.parse(msg)
        if (!userIsValid(id, item.userId)) {
            logger.warn(`Connection id "${id}:${connectionPool.get(id)?.ip}" try to impersonate user "${item.userId}"`)
            return;
        }
        /** @type {any} */
        const data = item.data
        switch (item.type) {
            case "list":
                cache.prepare("update connections set listed = ? where id = ?;").run(+data, id)
                break;
            case "room":
                /** @type {import("$lib/network.js").EventData<"room">} */
                const room = data
                if (room.action === "remove") {
                    cache.prepare("update connections set rooms_id = null where id = ?;").run(id)
                } else if (room.user) {
                    const rooms = []
                    rooms.push(room.roomId)
                    addUserToRoom(rooms, item.userId, room.user.name)
                        .then(() => {
                            cache.prepare("insert or ignore into rooms(id) values (?);").run(room.roomId)
                            cache.prepare("update connections set rooms_id = ? where id = ?;").run(room.roomId, id)
                            const task = cache.prepare("select * from rooms where id = ?;").get(room.roomId)
                            /** @type {{ id: string, vote: string | null }[]} */
                            const users = cache.prepare("select * from users;").all()
                            if (task.task) {
                                /** @type {{[id: string]: string}} */
                                const voted = {}
                                for (const user of users) {
                                    if (user.vote) {
                                        voted[user.id] = user.vote
                                    }
                                }
                                notify({
                                    evt: {
                                        voting: {
                                            taskId: task.task,
                                            voted
                                        }
                                    }
                                }, "room", [room.roomId])
                            }
                        })
                        .catch(logger.error)
                } else {
                    logger.warn("Cannot add or modify an non existing user")
                }
                break;
            case "votes":
                if (data?.taskId !== undefined) {
                    cache.prepare("update users set vote = null;").run()
                    cache.prepare("update rooms set task = ? where id = ?;").run(data.taskId, data.roomId)
                    notify({
                        evt: {
                            voting: {
                                taskId: data.taskId
                            }
                        }
                    }, "room", [data.roomId])
                }
                break;
            case "result":
                notify({
                    evt: {
                        voting: {
                            taskId: data.taskId,
                            show: true
                        }
                    }
                }, "room", [data.roomId])
                break;
            case "sets":
                cache.prepare("update connections set setted = ? where id = ?;").run(+data, id)
                break;
        }
        cache.prepare("insert or ignore into users(id) values (?);").run(item.userId)
        cache.prepare("update connections set users_id = ? where id = ?;").run(item.userId, id)
    }
}

/**
 * If a socket closes, it executes this function
 * @param {string} id
 * @return {(data: string) => void}
 */
function onClose(id) {
    return (data) => {
        cache.prepare("delete from connections where id = ?;").run(id)
    }
}

/**
 * If a socket error, it execute this function
 * @param {string} id
 * @return {(data: string) => void}
 */
function onError(id) {
    return (data) => {
        logger.warn(`Error on connection id ${id} : ${data}`)
    }
}

/**
 *
 * @param {string} userId
 * @return {string[] | undefined}
 */
export function getSubscribedRoom(userId) {
    /** @type {{rooms_id: string}[] | undefined} */
    const c = cache.prepare("select rooms_id from connections where users_id = ?;").all(userId)
    return c?.map(rooms => rooms.rooms_id)
}

/**
 * @param {EventTypes} evt
 * @param {ListenerType} type
 * @param {string[]} roomIds
 */
export function notify(evt, type, roomIds) {
    const to = roomIds.length > 0 ? JSON.stringify(roomIds) : "ALL"
    logger.info(`Broadcasting to ${to}: ${JSON.stringify(evt)}`)
    let connectionIds;
    switch (type) {
        case "list":
            connectionIds = cache.prepare("select id from connections where listed = ?;").all(1)
            if (connectionIds) {
                for (const {id} of connectionIds) {
                    logger.info(`Sending to ${id}:${connectionPool.get(id)?.ip}`)
                    connectionPool.get(id)?.socket?.send(JSON.stringify({
                        type,
                        update: evt
                    }))
                }
            }
            break
        case "sets":
            connectionIds = cache.prepare("select id from connections where setted = ?;").all(1)
            if (connectionIds) {
                for (const {id} of connectionIds) {
                    logger.info(`Sending to ${id}:${connectionPool.get(id)?.ip}`)
                    connectionPool.get(id)?.socket?.send(JSON.stringify({
                        type,
                        update: evt
                    }))
                }
            }
            break
        case "room":
            for (const roomId of roomIds) {
                connectionIds = cache.prepare("select id from connections where rooms_id = ?;").all(roomId)
                if (connectionIds) {
                    for (const {id} of connectionIds) {
                        logger.info(`Sending to ${id}:${connectionPool.get(id)?.ip}`)
                        connectionPool.get(id)?.socket?.send(JSON.stringify({
                            type,
                            update: evt
                        }))
                    }
                }
            }
            break
    }
}

/**
 * Vote in a room
 * @param {import("$lib/network.js").Vote} vote
 * @return {Promise<void>}
 */
export async function vote(vote) {
    cache.prepare("update users set vote = ? where id = ?;").run(vote.card, vote.userId)
}

async function close() {
    for (const connection of connectionPool.values())
        connection.socket.close()
    socket?.close(() => {
        socket = null
    })
    cache.close()
}

export default {
    init,
    close
}
