import {json} from "@sveltejs/kit";
import logger from "$lib/logger.js";

export async function POST() {
    logger.error("IM A TEAPOT")
    return json({
        message: "Want some tea?"
    }, {status: 418})
}