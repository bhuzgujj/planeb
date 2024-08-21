import Database from 'better-sqlite3';
import {queries} from "$lib/db/queries.js";
import logger from "$lib/logger.js";
import {DATABASE, DATABASE_FOLDER} from "$env/static/private";
import fs from "fs";
import {createId} from "../../idGenerator.js";
import constants from "../../constant.js";

/**
 * @typedef {import('$lib/data.d.ts').RoomInfo} RoomInfo
 * @typedef {import('$lib/data.d.ts').UserInfo} UserInfo
 * @typedef {import('$lib/data.d.ts').TaskInfo} TaskInfo
 * @typedef {import('$lib/data.d.ts').DbUser} DbUser
 * @typedef {import('$lib/data.d.ts').Query} Query
 * @typedef {import('$lib/data.d.ts').CardSet} CardSet
 * @typedef {import('$lib/data.d.ts').Card} Card
 * @typedef {import('$lib/data.d.ts').Room} Room
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
        db = new Database(path, { verbose: logger.debug });
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
    let db = new Database(`${dir}/${fileName}`, { verbose: logger.debug })
    try {
        let prep = db.prepare("select * from metadatas where keys = ?")
        let name = prep.get(constants.rooms.dbMetadata.name)
        let presisted = prep.get(constants.rooms.dbMetadata.presisted)
        let owner = prep.get(constants.rooms.dbMetadata.owner)
        let taskPrefix = prep.get(constants.rooms.dbMetadata.taskRegex)
        db.close()
        if (!presisted || !presisted?.vals) {
            logger.debug(`Deleting room: ${dir}/${fileName}`)
            fs.unlink(`${dir}/${fileName}`, logger.error)
        } else {
            rooms.set(fileName.substring(0, fileName.length - 3), {
                name: name.vals,
                isPersisted: presisted?.vals,
                owner: owner?.vals ?? "",
                taskRegex: taskPrefix?.vals,
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
        db = new Database(dbPath, { verbose: logger.debug });
        const set = db.prepare("insert into cards_set (id, names) values (?, ?);")
        set.run(id, cardSet.name);
        for (const card of cardSet.cards) {
            const c = db.prepare("insert into cards (id, val, label, cards_set_id) values (?, ?, ?, ?);")
            c.run(card.id, card.value, card.label, id);
        }
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
        db = new Database(dbPath, { verbose: logger.debug });
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
        cardsSet.set(id, cardSet);
    } catch (e) {
        logger.error(`card set failed modification: ${e}`)
    } finally {
        if (db) {
            db.close()
        }
    }
}

export async function deleteSet(id) {
    let dbPath = `${DATABASE_FOLDER}/${DATABASE}`;
    let db;
    try {
        db = new Database(dbPath, { verbose: logger.debug });
        db.prepare("delete from cards_set where id = ?;").run(id);
        cardsSet.delete(id);
    } catch (e) {
        logger.error(`card set failed modification: ${e}`)
    } finally {
        if (db) {
            db.close()
        }
    }

}

/**
 * Vote in a room
 * @param {import("$lib/network.js").Vote} vote
 * @return {Promise<void>}
 */
export async function vote(vote) {
    let dbPath = `${DATABASE_FOLDER}/rooms/${vote.roomId}.db`;
    try {
        const db = new Database(dbPath, { verbose: logger.debug })
        const exist = db.prepare("update votes set card_id = ? where user_id = ? and task_id = ?;")
            .run(vote.card, vote.userId, vote.tasksId)
        if (exist.changes === 0) {
            db.prepare("insert into votes(user_id, task_id, card_id) values(?, ?, ?);").run(vote.userId, vote.tasksId, vote.card)
        }
    } catch (e) {
        logger.error(`"${vote.roomId}:${vote.userId}" database failed to add a vote ${vote}: ${e}`)
    }
}

/**
 * Set final vote on a task
 * @param {import("$lib/network.js").AcceptedVote} vote
 * @return {Promise<void>}
 */
export async function acceptVote(vote) {
    let dbPath = `${DATABASE_FOLDER}/rooms/${vote.roomId}.db`;
    try {
        const db = new Database(dbPath, { verbose: logger.debug })
        db.prepare("update tasks set card_id = ? where id = ?;")
            .run(vote.card, vote.tasksId)
    } catch (e) {
        logger.error(`"${vote.roomId}:${vote.tasksId}" database failed to add a vote ${vote.card}: ${e}`)
    }
}

/**
 * Make a mod of a user
 * @param {{ userId: string, moderator: boolean, roomId }} mod
 */
export function moderation(mod) {
    let dbPath = `${DATABASE_FOLDER}/rooms/${mod.roomId}.db`;
    try {
        const db = new Database(dbPath, { verbose: logger.debug })
        db.prepare("update users set moderator = ? where id = ?;")
            .run(+mod.moderator, mod.userId)
    } catch (e) {
        logger.error(`"${mod.roomId}:${mod.userId}" database failed to add a vote ${mod.moderator}: ${e}`)
    }
}

/**
 * Comment a task
 * @param {import("$lib/network.js").Comment} comment
 */
export async function saveComment(comment) {
    let dbPath = `${DATABASE_FOLDER}/rooms/${comment.roomId}.db`;
    try {
        const db = new Database(dbPath, { verbose: logger.debug })
        db.prepare("update tasks set comments = ? where id = ?;")
            .run(comment.comment, comment.tasksId)
    } catch (e) {
        logger.error(`"${comment.roomId}:${comment.tasksId}" database failed to add a vote ${comment.comment}: ${e}`)
    }
}

export async function deleteTask(taskId, roomId) {
    let dbPath = `${DATABASE_FOLDER}/rooms/${roomId}.db`;
    try {
        const db = new Database(dbPath, { verbose: logger.debug })
        db.prepare("delete from tasks where id = ?;")
            .run(taskId)
    } catch (e) {
        logger.error(`"${roomId}:${taskId}" database failed to remove task: ${e}`)
    }
}

/**
 * Create a room
 * @param {string} name
 * @param {boolean} isPersisted
 * @param {{id: string, name: string}} moderator
 * @param {CardSet} cards
 * @param {string} taskRegex
 * @param {import("$lib/data.js").Task[]} tasks
 * @return {Promise<string>}
 */
export async function createRoom(name, isPersisted, moderator, cards, taskRegex, tasks) {
    const roomId = createId();
    let dbPath = `${DATABASE_FOLDER}/rooms/${roomId}.db`;
    try {
        logger.debug(`Initializing database "${roomId}:${name}"...`);
        await executeQuery(dbPath, "create_room", db => {
            const md = db.prepare("insert into metadatas (keys, vals) values (?, ?);")
            md.run(constants.rooms.dbMetadata.name, name);
            md.run(constants.rooms.dbMetadata.presisted, isPersisted);
            md.run(constants.rooms.dbMetadata.owner, moderator.id);
            if (taskRegex)
                md.run(constants.rooms.dbMetadata.taskRegex, taskRegex);
            const mod = db.prepare("insert into users (id, names, moderator) values (?, ?, 1);")
            mod.run(moderator.id, moderator.name);
            const card = db.prepare("insert into cards (id, val, label) values (?, ?, ?);")
            for (const c of cards.cards) {
                card.run(c.id, c.value, c.label);
            }
            const insertTask = db.prepare("insert into tasks (id, task_no, names) values (?, ?, ?);")
            for (const task of tasks) {
                insertTask.run(createId(), task.no ?? null, task.name);
            }
        })
        logger.debug(`"${roomId}:${name}" database initialized`)
        rooms.set(roomId, {
            name: name,
            isPersisted: isPersisted,
            owner: moderator.id,
            taskRegex: taskRegex
        });
        return roomId.toString()
    } catch (e) {
        logger.error(`"${roomId}:${name}" database failed initialized: ${e}`)
        return roomId.toString()
    }
}

/**
 * Add a task to a room
 * @param {import("$lib/data.js").Task} task
 * @param {string} roomId
 * @returns {Promise<string>}
 */
export async function addTaskToRoom(task, roomId) {
    const taskId = createId();
    let dbPath = `${DATABASE_FOLDER}/rooms/${roomId}.db`;
    let db;
    try {
        logger.debug(`"${roomId}:${task.name}" add a task: ${task}`)
        db = new Database(dbPath)
        if (task.no) {
            db.prepare("insert into tasks (id, names) values (?, ?);")
                .run(taskId, task.name)
        } else {
            db.prepare("insert into tasks (id, names, task_no) values (?, ?, ?);")
                .run(taskId, task.name, task.no)
        }
        return taskId.toString()
    } catch (e) {
        logger.error(`"${roomId}:${task.name}" failed to add a task: ${e}`)
        return taskId.toString()
    } finally {
        if (db) {
            db.close()
        }
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
        logger.debug(`Adding user into database "${roomId}:${user.names}"...`);
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
            const mod = db.prepare("insert into users (id, names, moderator) values (?, ?, 0);")
            mod.run(user.id, user.names);
        }
        db.close()
    } catch (e) {
        if (db) {
            db.close()
        }
        logger.error(`Error updating users from database: ${e}`)
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
 * @return {Room|null}
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
            tasks.push({
                id: task.id,
                name: task.names,
                no: task.task_no,
                comments: task.comments,
                vote: task.card_id,
            })
        }
        /** @type {Array<Card>} */
        let cards = [];
        for (const /** @type {{id: string, val: number, label: string}} */ card of db.prepare("select * from cards;").iterate()) {
            cards.push({
                id: card.id,
                value: card.val,
                label: card.label
            })
        }
        db.close()
        return {
            id,
            roomInfo,
            users,
            tasks,
            cards
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
export async function cleanup() {
    for (const [id, room] of rooms.entries()) {
        if (!room.isPersisted)
            deleteRoom(id)
    }
}