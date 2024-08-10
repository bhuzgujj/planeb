import {json} from "@sveltejs/kit";
import logger from "$lib/logger.js";

export async function POST({request}) {
    logger.debug("IM A TEAPOT")
    return json({message: "Want some tea?"}, {status: 418})
}