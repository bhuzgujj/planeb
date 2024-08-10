import Database from 'better-sqlite3';
import {queries} from "$lib/queries.js";
import logger from "$lib/logger.js";
import {DATABASE_FOLDER} from "$env/static/private";
import fs from "fs";

/**
 * @typedef {import('$lib/data.d.ts').ListInfo} RoomInfo
 * @typedef {import('$lib/data.d.ts').UserInfo} UserInfo
 * @typedef {import('$lib/data.d.ts').TaskInfo} TaskInfo
 * @typedef {import('$lib/data.d.ts').DbUser} DbUser
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
        db.close()
    } catch (e) {
        logger.debug(e)
        db.close()
        throw e
    }
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
    try {
        let prep = db.prepare("select * from metadatas where keys = ?")
        let name = prep.get("name")
        let presisted = prep.get("is_persisted")
        let owner = prep.get("owner")
        db.close()
        if (!presisted || !presisted?.vals) {
            logger.debug(`Deleting room: ${dir}/${fileName}`)
            fs.unlink(`${dir}/${fileName}`, logger.error)
        } else {
            rooms.set(fileName.substring(0, fileName.length - 3), {
                name: name.vals,
                isPersisted: presisted?.vals,
                owner: owner?.vals ?? ""
            });
        }
    } catch (e) {
        if (db) {
            db.close()
        }
        logger.error(`Could not read db ${roomFolder}/${fileName}: ${e}` );
        fs.unlink(`${dir}/${fileName}`, logger.error)
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
        fs.readdirSync(roomFolder)
            .forEach(file => fillState(roomFolder, file));
    } catch (e) {
        logger.error(`Could not read folder ${roomFolder}: ${e}`)
    }
    executeQuery(`${folder}/${masterDb}`, "init", null).catch(logger.error)
}

/**
 * Create a room
 * @param {string} name
 * @param {boolean} isPersisted
 * @param {{id: string, name: string}}moderator
 * @return {Promise<string>}
 */
export async function createRoom(name, isPersisted, moderator) {
    const roomId = crypto.randomUUID();
    let dbPath = `${DATABASE_FOLDER}/rooms/${roomId}.db`;
    try {
        await executeQuery(dbPath, "create_room", db => {
            const md = db.prepare("insert into metadatas (keys, vals) values (?, ?);")
            md.run("name", name);
            md.run("is_persisted", isPersisted);
            md.run("owner", moderator.id);
            const mod = db.prepare("insert into users (id, names, moderator) values (?, ?, 1);")
            mod.run(moderator.id, moderator.name);
        })
        rooms.set(roomId, { name: name, isPersisted: isPersisted, owner: moderator.id });
        return roomId.toString()
    } catch (e) {
        logger.error(e)
        return roomId.toString()
    }
}

/**
 *
 * @param {{id: string, names: string, moderator?: boolean, vote?: string}} user
 * @param {string} roomId
 * @returns {Promise<void>}
 */
export async function putUserInRoom(user, roomId) {
    let dbPath = `${DATABASE_FOLDER}/rooms/${roomId}.db`;
    let db;
    try {
        db = new Database(dbPath);
        let users = db.prepare("select count(*) from users where id = ?;").get(user.id);
        if (users['count(*)'] > 0) {
            if (user.moderator) {
                const mod = db.prepare("update users set names = ?, moderator = ? where id = ?;")
                mod.run(user.names, user.moderator, user.id);
            } else {
                const mod = db.prepare("update users set names = ? where id = ?;")
                mod.run(user.names, user.id);
            }
        } else {
            const mod = db.prepare("insert into users (id, names, moderator) values (?, ?, ?, ?);")
            mod.run(user.id, user.names, user.moderator);
        }
        db.close()
    } catch (e) {
        if (db) {
            db.close()
        }
        throw e
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
    const roomInfo = rooms.get(id);
    if (!roomInfo)
        return null
    let dbPath = `${DATABASE_FOLDER}/rooms/${id}.db`;
    const db = new Database(dbPath)
    try {
        /** @type {Array<UserInfo>} */
        let users = [];
        for (const /** @type {DbUser} */ user of db.prepare("select * from users;").iterate()) {
            users.push({
                id: user.id,
                name: user.names,
                moderator: !!user.moderator,
                vote: undefined
            })
        }
        /** @type {Array<TaskInfo>} */
        let tasks = [];
        for (const task of db.prepare("select * from tasks;").iterate()) {
            users.push(task)
        }
        logger.debug(users)
        db.close()
        return {
            id,
            roomInfo,
            users,
            tasks
        };
    } catch (e) {
        logger.error(e)
        if (db) {
            db.close()
        }
        throw e;
    }
}

/**
 * Delete a db
 * @param {string} id
 * @return {RoomInfo | undefined}
 */
export function deleteRoomById(id) {
    let roomDeleted = rooms.get(id);
    if (roomDeleted) {
        rooms.delete(id)
        deleteRoom(id);
    }
    return roomDeleted
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