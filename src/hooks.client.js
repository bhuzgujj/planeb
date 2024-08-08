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
    console.log(WebSocket)
    const socket = new WebSocket("ws://localhost:43594/");
    console.log(socket)
    socket.onopen = (event) => {
        console.log(event)
    }
    socket.onmessage = (event) => {
        console.log(event)
    }
    socket.send("LMAO")
    console.log("Started");
}

start()