import {json} from "@sveltejs/kit";

export async function POST({request}) {
    const body = request.json()

    return json({

    })
}