import {fail} from "@sveltejs/kit";
import {getCardSetById, getCardSets} from "$lib/gateway.js";

export function load(props) {
    return {
        sets: getCardSets()
    };
}

export const actions = {
    default: async ({request}) => {
        const data = await request.formData();
        const name = data.get("name");
        const persisted = data.get("persisted");
        const taskPrefix = data.get("task_prefix");
        /** @type any */
        const sets = data.get("sets");
        if(!sets) {
            return fail(400, {
                setError: "Select a card set"
            })
        }
        const cards = getCardSetById(sets);

        if (!name) {
            return fail(400, {
                nameError: "Require a room name"
            })
        } else if(!cards) {
            return fail(400, {
                setError: "Selected set unavailable"
            })
        }
        return {
            location: "/rooms/",
            name,
            persisted,
            cards,
            taskPrefix
        }
    }
};