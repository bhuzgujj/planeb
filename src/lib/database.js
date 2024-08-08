import Database from 'better-sqlite3';
import {queries} from "$lib/queries.js";
import logger from "$lib/logger.js";
import {DATABASE_FOLDER} from "$env/static/private";
import fs from "fs";

/**
 * @typedef {{
 *     name: string;
 *     isPersisted: boolean;
 * }} RoomInfo
 * @typedef {{
 *    name: string;
 *    vote: string;
 * }} UserInfo
 * @typedef {{
 *    no: string;
 *    name: string;
 *    vote: string;
 * }} TaskInfo
 * @typedef {"init" | "create_room"} Query
 */

/** @type {Map<string, RoomInfo>} */
let rooms = new Map()
let roomFolder = ""

/**
 * Execute a query on a database
 * @param {string} path
 * @param {Query} query
 * @param {((db: any) => void) | null} dataFiller
 * @return {Promise<void>}
 */
async function executeQuery(path, query, dataFiller) {
    logger.debug(`Initializing database...`);
    let sql = queries.readQuery(query);
    /**
     * @type {any}
     */
    let db
    try {
        db = new Database(path);
        db.exec(sql)
        if (dataFiller) {
            dataFiller(db)
        }
    } catch (e) {
        logger.debug(e)
        throw e
    } finally {
        if (db) {
            db.close()
        }
    }
    return db
}

/**
 * Get room data from its db
 * @param {string} dir
 * @param {string} fileName
 */
function fillState(dir, fileName) {
    if (!fileName.endsWith(".db"))
        return
    logger.debug(`Room found: ${dir}/${fileName}`)
    let db = new Database(`${dir}/${fileName}`)
    let prep = db.prepare("select * from metadatas where keys = ?")
    let name = prep.get("name")
    let presisted = prep.get("is_persisted")
    db.close()
    if (!presisted || !presisted?.vals) {
        logger.debug(`Deleting room: ${dir}/${fileName}`)
        fs.unlink(`${dir}/${fileName}`, logger.error)
    } else {
        rooms.set(fileName.substring(0, fileName.length - 3), { name: name.vals, isPersisted: presisted?.vals });
    }
}

/**
 * Initialize master db and room state
 * @param {string} folder
 * @param {string} rooms
 * @param {string} masterDb
 */
export function init(folder, rooms, masterDb) {
    logger.debug("Starting database...");
    roomFolder = `${folder}/${rooms}`;
    try {
        fs.mkdirSync(roomFolder, { recursive: true });
    } catch (e) {
        logger.debug(`Could not create folder ${roomFolder}`)
    }

    try {
        fs.readdirSync(roomFolder).forEach(file => fillState(roomFolder, file));
    } catch (e) {
        logger.error(`Could not read folder ${roomFolder}`)
    }
    executeQuery(`${folder}/${masterDb}`, "init", null).catch(logger.error)
}

/**
 * Create a room
 * @param {string} name
 * @param {boolean} isPersisted
 * @return {Promise<string>}
 */
export async function createRoom(name, isPersisted) {
    const roomId = crypto.randomUUID();
    let dbPath = `${DATABASE_FOLDER}/rooms/${roomId}.db`;
    try {
        await executeQuery(dbPath, "create_room", db => {
            const prep = db.prepare("insert into metadatas (keys, vals) values (?, ?);")
            prep.run("name", name);
            prep.run("is_persisted", isPersisted);
        })
        rooms.set(roomId, { name: name, isPersisted: isPersisted });
        return roomId.toString()
    } catch (e) {
        logger.error(e)
        return roomId.toString()
    }
}

/**
 * Get all rooms
 * @return {Map<string, RoomInfo>}
 */
export function getRooms() {
    return rooms;
}

/**
 * Get room by id
 * @param {string} id
 * @return {{id: string, users: UserInfo[], tasks: TaskInfo[], roomInfo: RoomInfo}|null}
 */
export function getRoomsById(id) {
    if (!rooms.has(id))
        return null
    const roomInfo = rooms.get(id);
    if (!roomInfo)
        return null
    return {
        id,
        roomInfo,
        users: [],
        tasks: []
    };
}

/**
 * Delete a db
 * @param {string} id
 */
export function deleteRoomById(id) {
    if (rooms.has(id)) {
        rooms.delete(id)
        deleteRoom(id);
    }
}

/**
 * Physically delete a db
 * @param {string} id
 */
function deleteRoom(id) {
    fs.unlink(`${roomFolder}/${id}.db`, err => {
        if (err) {
            logger.error(err)
        }
    })
}

/**
 * Delete database not persisted
 */
export function cleanup() {
    for (const [id, room] of rooms.entries()) {
        if (!room.isPersisted)
            deleteRoom(id)
    }
}