import socket from "$lib/socket.js";
import ls from "./constant.js";

let started = false;

function start() {
    if (started) {
        return
    }
    started = true;
    console.log("Starting");

    if (!localStorage.getItem(ls.itemKeys.id)) {
        localStorage.setItem(ls.itemKeys.id, crypto.randomUUID().toString())
    }
    socket.init()
    console.log("Started");
}

start()