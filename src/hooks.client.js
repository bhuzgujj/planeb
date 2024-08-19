import socket from "$lib/net/socket.js";
import constants from "./constant.js";
import {createId} from "./idGenerator.js";

let started = false;
const shouldLog = false

function start() {
    if (started) {
        return
    }
    started = true;
    console.log("Starting");

    if (!localStorage.getItem(constants.localStorageKeys.id)) {
        localStorage.setItem(constants.localStorageKeys.id, createId().toString())
    }

    if (!localStorage.getItem(constants.localStorageKeys.name)) {
        localStorage.setItem(constants.localStorageKeys.name, "unknown")
    }
    socket.init(shouldLog)
    console.log("Started");
}

start()