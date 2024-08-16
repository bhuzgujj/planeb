import {WebSocketServer} from "ws";
import logger from "$lib/logger.js";
import {addUserToRoom} from "$lib/gateway.js";
import Database from "better-sqlite3";
import {queries} from "$lib/db/queries.js";

/**
 * @typedef {import('$lib/network.d.ts').CrudAction} UpdateType
 * @typedef {import('$lib/data.d.ts').RoomInfo} RoomInfo
 * @typedef {import('$lib/network.d.ts').EventTypes} EventTypes
 * @typedef {import('$lib/network.d.ts').SetsEvent} SetsEvent
 * @typedef {import('$lib/network.d.ts').ListEvent} ListEvent
 * @typedef {import('$lib/network.d.ts').RoomEvent} RoomEvent
 * @typedef {import('$lib/network.d.ts').ListenerType} ListenerType
 */

const db = new Database(":memory:", { verbose: logger.debug })

/** @type {WebSocketServer | null} */
let socket = null;
/** @type {Map<string, {socket: any, ip: string}>} */
const connectionPool = new Map();

function init() {
    if (socket) {
        return
    }
    logger.debug("Initializing websocket...")
    socket = new WebSocketServer({
        port: 43594
    })
    db.exec(queries.readQuery("connections"))
    /** @type {Promise<void>} */
    const creation = new Promise((resolve, reject) => {
        if (!socket)
            throw new Error("WebSocket not initialized");
        try {
            socket.on("connection", (ws, req) => {
                const id = crypto.randomUUID();
                db.prepare("insert into connections (id) values (?)").run(id)
                connectionPool.set(id, {socket: ws, ip: req.socket.remoteAddress})
                ws.on("message", onMessage(id))
                ws.on("close", onClose(id))
                ws.on("error", onError(id))
                ws.send(JSON.stringify({ connectionId: id }))
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
        /**
         * @template {ListenerType} T
         * @type {import("$lib/network.js").WebSocketRegisteringEvent<T>}
         */
        const item = JSON.parse(data)
        /** @type {any} */
        const evt = item.data
        switch (item.type) {
            case "list":
                db.prepare("update connections set listed = ? where id = ?;").run(+evt, id)
                break;
            case "room":
                /** @type {import("$lib/network.js").EventData<"room">} */
                const room = evt
                if (room.action === "remove") {
                    db.prepare("update connections set rooms_id = null where id = ?;").run(id)
                } else if (room.user) {
                    const rooms = []
                    rooms.push(room.roomId)
                    addUserToRoom(rooms, item.userId, room.user.name)
                        .then(() => {
                            db.prepare("insert or ignore into rooms(id) values (?);").run(room.roomId)
                            db.prepare("update connections set rooms_id = ? where id = ?;").run(room.roomId, id)
                            const task = db.prepare("select * from rooms where id = ?;").get(room.roomId)
                            const users = db.prepare("select * from users;").all()
                            if (task.task) {
                                notify({
                                    evt: {
                                        voting: {
                                            taskId: task.task,
                                            voted: users.reduce((acc, user) => {
                                                acc[user.id] = user.vote
                                                return acc
                                            }, {})
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
                if (evt?.taskId !== undefined) {
                    db.prepare("update users set vote = null;").run()
                    db.prepare("update rooms set task = ? where id = ?;").run(evt.taskId, evt.roomId)
                    notify({
                        evt: {
                            voting: {
                                taskId: evt.taskId
                            }
                        }
                    }, "room", [evt.roomId])
                }
                break;
            case "sets":
                db.prepare("update connections set setted = ? where id = ?;").run(+evt, id)
                break;
        }
        db.prepare("insert or ignore into users(id) values (?);").run(item.userId)
        db.prepare("update connections set users_id = ? where id = ?;").run(item.userId, id)
    }
}

/**
 * If a socket closes, it executes this function
 * @param {string} id
 * @return {(data: string) => void}
 */
function onClose(id) {
    return (data) => {
        db.prepare("delete from connections where id = ?;").run(id)
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
    const connections = db.prepare("select rooms_id from connections where users_id = ?;").all(userId)
    return connections?.map(rooms => rooms.rooms_id)
}

/**
 * @param {EventTypes} evt
 * @param {ListenerType} type
 * @param {string[]} roomIds
 */
export function notify(evt, type, roomIds) {
    logger.info(`Broadcasting: ${JSON.stringify(evt)}`)
    let connectionIds;
    switch (type) {
        case "list":
            connectionIds = db.prepare("select id from connections where listed = ?;").all(1)
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
            connectionIds = db.prepare("select id from connections where setted = ?;").all(1)
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
                connectionIds = db.prepare("select id from connections where rooms_id = ?;").all(roomId)
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
    db.prepare("update users set vote = ? where id = ?;").run(vote.card, vote.userId)
}

function close() {
    for (const connection of connectionPool.values())
        connection?.close()
    socket?.close(() => {
        socket = null
    })
    db.close()
}

export default {
    init,
    close
}
