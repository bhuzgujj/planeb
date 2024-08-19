import socket from "$lib/net/socket.js";
import ls from "./constant.js";
import {createId} from "./idGenerator.js";

let started = false;
const shouldLog = false

function start() {
    if (started) {
        return
    }
    started = true;
    console.log("Starting");

    if (!localStorage.getItem(ls.itemKeys.id)) {
        localStorage.setItem(ls.itemKeys.id, createId().toString())
    }

    if (!localStorage.getItem(ls.itemKeys.name)) {
        localStorage.setItem(ls.itemKeys.name, "unknown")
    }
    socket.init(shouldLog)
    console.log("Started");
}

start()