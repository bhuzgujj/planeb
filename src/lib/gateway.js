import * as db from './db/database.js';
import * as ws from './net/websocket.js';
import logger from "$lib/logger.js";

/**
 * @typedef {import('$lib/data.d.ts').ListInfo} RoomInfo
 * @typedef {import('$lib/data.d.ts').UserInfo} UserInfo
 * @typedef {import('$lib/data.d.ts').TaskInfo} TaskInfo
 * @typedef {import('$lib/data.d.ts').DbUser} DbUser
 * @typedef {import('$lib/data.d.ts').CardSet} CardSet
 *
 * @typedef {import('$lib/network.d.ts').ListenerType} ListenerType
 * @typedef {import('$lib/network.d.ts').RoomModificationEvent} RoomEvent
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
 * @return {Promise<string>}
 */
export function createRoom(name, isPersisted, moderator, cards) {
    return db.createRoom(name, isPersisted, moderator, cards);
}

/**
 * Change name
 * @param {string} id
 * @param {string} name
 */
export function changeName(id, name) {
    return ws.changeName(id, name)
}

/**
 * Update room list for subscribed
 * @param {ListEvent | RoomEvent} evt
 * @param {ListenerType} type
 */
export function updateList(evt, type) {
    return ws.updateList(evt, type)
}

/**
 * Get room by id
 * @param {string} id
 * @return {{id: string, users: UserInfo[], tasks: TaskInfo[], roomInfo: RoomInfo}|null}
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
    await ws.updateList({
        action: "add",
        id,
        evt: set
    }, "sets")
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
    await ws.updateList({
        action: "update",
        id,
        evt: cardSet
    }, "sets")
}