import Database from 'better-sqlite3';
import {queries} from "$lib/queries.js";
import logger from "$lib/logger.js";
import {DATABASE_FOLDER} from "$env/static/private";
import fs from "fs";

/** @type {Map<string, Rooms>} */
let rooms = new Map()
let roomFolder = ""

/**
 * Execute a query on a database
 * @param {string} path
 * @param {Query} query
 * @param {((db: Database) => void)?} dataFiller
 * @return {Promise<void>}
 */
function executeQuery(path, query, dataFiller) {
    logger.debug(`Initializing database...`);
    let sql = queries.readQuery(query);
    return new Promise((resolve, reject) => {
        try {
            let db = new Database(path);
            db.exec(sql)
            if (dataFiller) {
                dataFiller(db)
            }
            resolve(db);
        } catch (e) {
            reject(e)
        }
    })
        .then((db) => {
            logger.debug("Database initialized!")
            return db
        })
        .catch(err => {
            logger.error("Failed to initialize database...");
            logger.error(err)
        })
        .finally(db => {
            if (db) {
                db.close()
            }
        })
}

/**
 * Get room data from its db
 * @param {string} dir
 * @param {string} fileName
 */
function fillState(dir, fileName) {
    if (!fileName.endsWith(".db"))
        return
    let db = new Database(`${dir}/${fileName}`)
    let prep = db.prepare("select * from metadatas where keys = ?")
    let name = prep.get("name")
    let presisted = prep.get("is_persisted")
    if (!presisted || !presisted?.vals) {
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
    logger.debug(JSON.stringify({folder, rooms, masterDb}));
    roomFolder = `${folder}/${rooms}`;
    try {
        fs.mkdirSync(folder)
        fs.mkdirSync(roomFolder)
    } catch (e) {
        logger.debug(e)
    }

    try {
        fs.readdirSync(roomFolder).forEach(file => fillState(roomFolder, file));
    } catch (e) {
        logger.debug(e)
    }
    executeQuery(`${folder}/${masterDb}`, "init").catch(logger.error)
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
    return executeQuery(dbPath, "create_room", db => {
        const prep = db.prepare("insert into metadatas (keys, vals) values (?, ?);")
        prep.run("name", name);
        prep.run("is_persisted", isPersisted);
    })
        .then(() => {
            rooms.set(roomId, { name: name, isPersisted: isPersisted });
            return roomId
        })
        .catch(logger.error)
}

/**
 * Get all rooms
 * @return {Map<string, Rooms>}
 */
export function getRooms() {
    return rooms;
}

export function getRoomsById(id) {
    if (!rooms.has(id))
        return null
    return {
        id: id,
        roomInfo: rooms.get(id),
        tasks: []
    };
}

export function deleteRoomById(id) {
    if (rooms.has(id)) {
        rooms.delete(id)
        deleteRoom(id);
    }
}

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