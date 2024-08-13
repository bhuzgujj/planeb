import logger from "$lib/logger.js";
import {json} from "@sveltejs/kit";
import {modifySet} from "$lib/gateway.js";

/**
 * @typedef {import("$lib/logger.js").default}
 */

export async function PUT({params, request}) {
    const body = await request.json();
    logger.debug(`Modifying ${params.id}`)
    await modifySet(params.id, body)
    return json({
        setId: params.id
    })
}