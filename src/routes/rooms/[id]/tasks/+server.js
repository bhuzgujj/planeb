import {json} from "@sveltejs/kit";

export async function POST({request}) {
    const body = await request.json()
    return json(body)
}