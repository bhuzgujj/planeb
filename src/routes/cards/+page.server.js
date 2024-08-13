import {createCardSet, getCardSets} from "$lib/gateway.js";
import {fail} from "@sveltejs/kit";

export function load(props) {
    return {
        sets: getCardSets()
    };
}

export const actions = {
    default: async ({request}) => {
        const data = await request.formData();
        /** @type any */
        const name = data.get("name");
        if (!name) {
            return fail(400, {
                nameError: "Requires a name"
            })
        } else {
            await createCardSet(name)
            return {
                location: "/rooms/",
                name
            }
        }
    }
};