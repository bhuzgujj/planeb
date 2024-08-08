import {WebSocketServer} from "ws";
import logger from "$lib/logger.js";

const

let socket = null;

function init() {
    logger.debug("Initializing websocket...")
    if (socket != null) {
        return
    }
    socket = new WebSocketServer({
        port: 43594
    })
    new Promise((resolve, reject) => {
        socket.on("connection", (ws, req) => {
            const ip = req.socket.remoteAddress;
            logger.debug(ip)
            ws.on("message", logger.debug)
            ws.on("close", logger.debug)
            ws.on("error", logger.error)
            ws.send(JSON.stringify({ip}))
        })
        resolve()
    })
}

function close() {
    socket.close()
}

export default {
    init,
    close
}
