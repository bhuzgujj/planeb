import {json} from "@sveltejs/kit";
import {addTaskToRoom} from "$lib/gateway.js";

export async function POST({params, request}) {
    const body = await request.json()
    const response = await addTaskToRoom(body.tasks, params.id, body.userId)
    if (response) {
        return json(body)
    } else {
        return json({ message: "Forbidden" }, {status: 403})
    }
}