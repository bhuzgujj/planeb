import {json} from "@sveltejs/kit";
import {changeName} from "$lib/websocket.js";

export async function PUT({params, request}) {
    const newValues = await request.json()
    await changeName(params.id, newValues.name)
    return json({
        userId: params.id,
        name: newValues.name
    })
}