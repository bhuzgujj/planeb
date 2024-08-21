import * as db from './db/database.js';
import * as ws from './net/websocket.js';
import logger from "$lib/logger.js";
import {putUserInRoom} from "./db/database.js";
import {createId} from "../idGenerator.js";

/**
 * @typedef {import('$lib/data.d.ts').RoomInfo} RoomInfo
 * @typedef {import('$lib/data.d.ts').UserInfo} UserInfo
 * @typedef {import('$lib/data.d.ts').TaskInfo} TaskInfo
 * @typedef {import('$lib/data.d.ts').DbUser} DbUser
 * @typedef {import('$lib/data.d.ts').CardSet} CardSet
 * @typedef {import('$lib/data.d.ts').Room} Room
 *
 * @typedef {import('$lib/network.d.ts').ListenerType} ListenerType
 * @typedef {import('$lib/network.d.ts').RoomEvent} RoomEvent
 * @typedef {import('$lib/network.d.ts').ListEvent} ListEvent
 *
 * @typedef {import('$lib/config.js').GatewayConfig} GatewayConfig
 */

/**
 * Initialize everything
 * @param {GatewayConfig} config
 */
export function initialize(config) {
    logger.init(config.logging)
    db.init(config.database);
}

/**
 * Get all rooms
 * @return {Map<string, RoomInfo>}
 */
export function getRooms() {
    return db.getRooms()
}

/**
 * Create a room
 * @param {string} name
 * @param {boolean} isPersisted
 * @param {{id: string, name: string}} moderator
 * @param {CardSet} cards
 * @param {string} taskPrefix
 * @param {import("$lib/data.js").Task[]} tasks
 * @return {Promise<string>}
 */
export function createRoom(name, isPersisted, moderator, cards, taskPrefix, tasks) {
    return db.createRoom(name, isPersisted, moderator, cards, taskPrefix, tasks);
}

/**
 * Change name
 * @param {string} id
 * @param {string} name
 */
export function changeName(id, name) {
    let roomSubscribed = ws.getSubscribedRoom(id)
    if (!roomSubscribed || roomSubscribed.length === 0) {
        logger.warn("No room subed for userid: " + id)
        return;
    }
    return addUserToRoom(roomSubscribed, id, name);
}

/**
 * Add a user to specific rooms than notify those rooms
 * @param {string[]} roomAdded
 * @param {string} id
 * @param {string} name
 * @returns {Promise<void>}
 */
export function addUserToRoom(roomAdded, id, name) {
    const executions = []
    for (const room of roomAdded) {
        executions.push(putUserInRoom({id, names: name}, room))
    }
    return Promise.all(executions)
        .then(() => ws.notify({evt: {user: {id, name}}, action: "update"}, "room", roomAdded))
        .catch(e => logger.error("Error mid promises: " + e))
}

/**
 * Update room list for subscribed
 * @param {ListEvent | RoomEvent} evt
 * @param {ListenerType} type
 */
export function updateList(evt, type) {
    return ws.notify(evt, type, [])
}

/**
 * Get room by id
 * @param {string} id
 * @return {Room|null}
 */
export function getRoomsById(id) {
    return db.getRoomsById(id)
}

/**
 * Get cardsets by id
 * @param {string} id
 * @return {CardSet | undefined}
 */
export function getCardSetById(id) {
    return db.getCardSet().get(id)
}

/**
 * Get cardsets
 * @return {Map<string, CardSet>}
 */
export function getCardSets() {
    return db.getCardSet()
}

/**
 * Create a card set
 * @param {string} name
 * @returns {Promise<void>}
 */
export async function createCardSet(name) {
    const id= createId()
    /** @type {CardSet} */
    let set = {
        name,
        cards: [
            {
                id: createId(),
                value: 1,
                label: "1"
            },
            {
                id: createId(),
                value: 2,
                label: "2"
            },
        ]
    }
    await db.createCardSet(id, set)
    await ws.notify({
        action: "add",
        id,
        evt: set
    }, "sets", [])
}

/**
 *
 * @param {string} id
 * @param {CardSet} cardSet
 * @returns {Promise<void>}
 */
export async function modifySet(id, cardSet) {
    await db.modifyCardSet(id, cardSet)
    await ws.notify({
        action: "update",
        id,
        evt: cardSet
    }, "sets", [])
}

/**
 * Delete card set
 * @param {string} id
 * @return {Promise<void>}
 */
export async function deleteSet(id) {
    await db.deleteSet(id)
    await ws.notify({
        action: "remove",
        id,
        evt: {}
    }, "sets", [])
}

/**
 * Add a task to a room
 * @param {import("$lib/data.js").Task} task
 * @param {string} roomId
 * @returns {Promise<void>}
 */
export async function addTaskToRoom(task, roomId) {
    const id = await db.addTaskToRoom(task, roomId)
    /** @type {import("$lib/network.js").RoomEvent} */
    const evt = {
        evt: {
            task: {
                action: "add",
                id,
                evt: {
                    name: task.name,
                    no: task.no,
                }
            }
        }
    };
    const rooms = []
    rooms.push(roomId)
    await ws.notify(evt, "room", rooms)
}

/**
 * Vote in a room
 * @param {import("$lib/network.js").Vote} vote
 * @return {Promise<void>}
 */
export async function votes(vote) {
    const dbExec = db.vote(vote)
    const cache = ws.vote(vote)
    ws.notify({
        evt: {
            user: {
                id: vote.userId,
                vote: vote.card
            },
        }
    }, "room", [vote.roomId])
    await Promise.all([dbExec, cache])
}

/**
 * Comment a task
 * @param {import("$lib/network.js").Comment} comment
 */
export async function saveComment(comment) {
    const dbExec = db.saveComment(comment)
    ws.notify({
        evt: {
            task: {
                action: "update",
                id: comment.tasksId,
                evt: {
                    comments: comment.comment
                }
            },
        }
    }, "room", [comment.roomId])
    await Promise.all([dbExec])
}

/**
 * Make a mod of a user
 * @param {{ userId: string, moderator: boolean, roomId }} mod
 */
export async function moderation(mod) {
    const dbExec = db.moderation(mod)
    ws.notify({
        evt: {
            user: {
                action: "update",
                id: mod.userId,
                moderator: mod.moderator,
            },
        }
    }, "room", [mod.roomId])
    await Promise.all([dbExec])
}

/**
 * Vote in a room
 * @param {import("$lib/network.js").AcceptedVote} vote
 * @return {Promise<void>}
 */
export async function acceptVote(vote) {
    const dbExec = db.acceptVote(vote)
    ws.notify({
        evt: {
            task: {
                action: "update",
                id: vote.tasksId,
                evt: {
                    vote: vote.card
                }
            },
        }
    }, "room", [vote.roomId])
    await Promise.all([dbExec])
}

/**
 * Delete task
 * @param {string} taskId
 * @param {string} roomId
 * @return {Promise<void>}
 */
export async function deleteTask(taskId, roomId) {
    const dbExec = db.deleteTask(taskId, roomId)
    ws.notify({
        evt: {
            task: {
                action: "remove",
                id: taskId
            },
        }
    }, "room", [roomId])
    await Promise.all([dbExec])
}