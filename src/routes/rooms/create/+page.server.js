import {fail} from "@sveltejs/kit";

export const actions = {
    default: async ({request}) => {
        const data = await request.formData();
        const name = data.get("name");
        const persisted = data.get("persisted");
        if (!name) {
            return fail(400, {
                nameError: "Require a room name"
            })
        } else {
            return {
                location: "/rooms/",
                name,
                persisted
            }
        }
    }
};