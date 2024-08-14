import {json} from "@sveltejs/kit";
import {addTaskToRoom} from "$lib/gateway.js";

export async function POST({params, request}) {
    const body = await request.json()
    await addTaskToRoom(body, params.id)
    return json(body)
}