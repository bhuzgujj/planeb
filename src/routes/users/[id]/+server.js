import {json} from "@sveltejs/kit";

export async function PUT({params, request}) {
    const newValues = await request.json()
    return json({
        userId: params.id,
        name: newValues.name
    })
}