import * as db from './db/database.js';
import * as ws from './net/websocket.js';
import logger from "$lib/logger.js";
import {putUserInRoom} from "./db/database.js";

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
 * @return {Promise<string>}
 */
export function createRoom(name, isPersisted, moderator, cards, taskPrefix) {
    return db.createRoom(name, isPersisted, moderator, cards, taskPrefix);
}

/**
 * Add a user to specific rooms than notify those rooms
 * @param {Set<String>}roomAdded
 * @param {string} id
 * @param {string} name
 * @returns {Promise<void>}
 */
export function addUserToRoom(roomAdded, id, name) {
    let executions = [];
    for (const roomId of roomAdded.values()) {
        executions.push(putUserInRoom({id, names: name}, roomId))
    }
    return Promise.all(executions)
        .then(() => ws.notify({evt: {user: {id, name}}, action: "update"}, "room", roomAdded))
        .catch(e => logger.error("Error mid promises: " + e))
}

/**
 * Change name
 * @param {string} id
 * @param {string} name
 */
export function changeName(id, name) {
    /** @type {Set<string>} */
    let roomSubscribed = ws.getSubscribedRoom(id)
    if (roomSubscribed.size < 1) {
        logger.warn("No room subed for userid: " + id)
        return;
    }
    return addUserToRoom(roomSubscribed, id, name);
}

/**
 * Update room list for subscribed
 * @param {ListEvent | RoomEvent} evt
 * @param {ListenerType} type
 */
export function updateList(evt, type) {
    return ws.notify(evt, type, new Set())
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
    const id= crypto.randomUUID()
    /** @type {CardSet} */
    let set = {
        name,
        cards: [
            {
                id: crypto.randomUUID(),
                value: 1,
                label: "1"
            },
            {
                id: crypto.randomUUID(),
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
    }, "sets", new Set())
}

/**
 *
 * @param {string} id
 * @param {CardSet} cardSet
 * @returns {Promise<void>}
 */
export async function modifySet(id, cardSet) {
    logger.debug(cardSet)
    await db.modifyCardSet(id, cardSet)
    await ws.notify({
        action: "update",
        id,
        evt: cardSet
    }, "sets", new Set())
}