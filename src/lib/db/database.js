import Database from 'better-sqlite3';
import {queries} from "$lib/db/queries.js";
import logger from "$lib/logger.js";
import {DATABASE, DATABASE_FOLDER} from "$env/static/private";
import fs from "fs";


/**
 * @typedef {import('$lib/data.d.ts').ListInfo} RoomInfo
 * @typedef {import('$lib/data.d.ts').UserInfo} UserInfo
 * @typedef {import('$lib/data.d.ts').TaskInfo} TaskInfo
 * @typedef {import('$lib/data.d.ts').DbUser} DbUser
 * @typedef {import('$lib/data.d.ts').Query} Query
 * @typedef {import('$lib/data.d.ts').CardSet} CardSet
 * @typedef {import('$lib/data.d.ts').Card} Card
 *
 * @typedef {import('$lib/config.js').DatabaseConfig} DatabaseConfig
 */

/** @type {Map<string, RoomInfo>} */
let rooms = new Map()
/** @type {Map<string, CardSet>} */
let cardsSet = new Map()
let roomFolder = ""

/**
 * Initialize master db and room state
 * @param {DatabaseConfig} config
 */
export function init(config) {
    logger.debug("Starting database...");
    roomFolder = `${config.folder}/${config.roomSubFolder}`;
    try {
        fs.mkdirSync(roomFolder, {recursive: true});
    } catch (e) {
        logger.debug(`Could not create folder ${roomFolder}`)
    }

    try {
        fs.readdirSync(roomFolder)
            .forEach(file => fillState(roomFolder, file));
    } catch (e) {
        logger.error(`Could not read folder ${roomFolder}: ${e}`)
    }
    logger.debug(`Initializing master database...`);
    executeQuery(`${config.folder}/${config.masterDbNames}`, "init", db => {
        /** @type {Array<any>} */
        const sets = db.prepare("select * from cards_set;").all();
        for (const set of sets) {
            /** @type {Array<any>} */
            const cards = db.prepare("select * from cards where cards_set_id = ?;").all(set.id);
            cardsSet.set(set.id, {
                name: set.names,
                cards: cards.map(card => ({
                    id: card.id,
                    value: card.val,
                    label: card.label,
                }))
            })
        }
    })
        .then(() => logger.debug(`Master database initialized`))
}

/**
 * Execute a query on a database
 * @param {string} path
 * @param {Query} query
 * @param {((db: any) => void) | null} dataFiller
 * @return {Promise<void>}
 */
async function executeQuery(path, query, dataFiller) {
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
        db.close()
        logger.error(e)
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
        logger.error(`Could not read db ${roomFolder}/${fileName}: ${e}`);
        fs.unlink(`${dir}/${fileName}`, logger.error)
    }
}

/**
 *
 * @param {string} id
 * @param {{name: string, cards: Array<Card>}} cardSet
 */
export async function createCardSet(id, cardSet) {
    let dbPath = `${DATABASE_FOLDER}/${DATABASE}`;
    let db;
    try {
        logger.debug(`Initializing card set...`);
        db = new Database(dbPath);
        const set = db.prepare("insert into cards_set (id, names) values (?, ?);")
        set.run(id, cardSet.name);
        for (const card of cardSet.cards) {
            const c = db.prepare("insert into cards (id, val, label, cards_set_id) values (?, ?, ?, ?);")
            c.run(card.id, card.value, card.label, id);
        }
        logger.debug(`card set initialized`)
        cardsSet.set(id, cardSet);
    } catch (e) {
        logger.error(`card set failed initialized: ${e}`)
    } finally {
        if (db) {
            db.close()
        }
    }
}

/**
 *
 * @param {string} id
 * @param {{name: string, cards: Array<Card>}} cardSet
 */
export async function modifyCardSet(id, cardSet) {
    let dbPath = `${DATABASE_FOLDER}/${DATABASE}`;
    let db;
    try {
        logger.debug(`Modifying card set...`);
        db = new Database(dbPath);
        db.prepare("update cards_set set names = ? where id = ?;")
            .run(cardSet.name, id);
        for (const card of cardSet.cards) {
            const resp = db.prepare("update cards set val = ?, label = ? where id = ?;")
                .run(card.value, card.label, card.id);
            if (resp.changes === 0) {
                db.prepare("insert into cards (id, val, label, cards_set_id) values (?, ?, ?, ?);")
                    .run(card.id, card.value, card.label, id);
            }
        }
        logger.debug(`card set Modifyed`)
        cardsSet.set(id, cardSet);
    } catch (e) {
        logger.error(`card set failed modification: ${e}`)
    } finally {
        if (db) {
            db.close()
        }
    }
}

/**
 * Create a room
 * @param {string} name
 * @param {boolean} isPersisted
 * @param {{id: string, name: string}} moderator
 * @param {CardSet}cards
 * @return {Promise<string>}
 */
export async function createRoom(name, isPersisted, moderator, cards) {
    const roomId = crypto.randomUUID();
    let dbPath = `${DATABASE_FOLDER}/rooms/${roomId}.db`;
    try {
        logger.debug(`Initializing database "${roomId}:${name}"...`);
        await executeQuery(dbPath, "create_room", db => {
            const md = db.prepare("insert into metadatas (keys, vals) values (?, ?);")
            md.run("name", name);
            md.run("is_persisted", isPersisted);
            md.run("owner", moderator.id);
            const mod = db.prepare("insert into users (id, names, moderator) values (?, ?, 1);")
            mod.run(moderator.id, moderator.name);
            const card = db.prepare("insert into cards (id, val, label) values (?, ?, ?);")
            for (const c of cards.cards) {
                card.run(c.id, c.value, c.label);
            }
        })
        logger.debug(`"${roomId}:${name}" database initialized`)
        rooms.set(roomId, {name: name, isPersisted: isPersisted, owner: moderator.id});
        return roomId.toString()
    } catch (e) {
        logger.error(`"${roomId}:${name}" database failed initialized: ${e}`)
        return roomId.toString()
    }
}

/**
 *
 * @param {{id: string, names: string, moderator?: boolean}} user
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
 * @return {Map<string, CardSet>}
 */
export function getCardSet() {
    return cardsSet;
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