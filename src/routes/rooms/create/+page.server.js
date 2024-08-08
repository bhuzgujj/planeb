import {fail} from "@sveltejs/kit";

export const actions = {
    default: async ({cookies, request}) => {
        const data = await request.formData();
        let name = data.get("name");
        let persisted = data.get("persisted");
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