import socket from "$lib/net/socket.js";
import ls from "./constant.js";

let started = false;
const shouldLog = false

function start() {
    if (started) {
        return
    }
    started = true;
    console.log("Starting");

    if (!localStorage.getItem(ls.itemKeys.id)) {
        localStorage.setItem(ls.itemKeys.id, crypto.randomUUID().toString())
    }
    socket.init(shouldLog)
    console.log("Started");
}

start()