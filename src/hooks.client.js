import {init} from "$lib/socket.js";

let started = false;

function start() {
    if (started) {
        return
    }
    started = true;
    console.log("Starting");

    if (!localStorage.getItem("planeb.id")) {
        localStorage.setItem("planeb.id", crypto.randomUUID().toString())
    }
    init()
    console.log("Started");
}

start()