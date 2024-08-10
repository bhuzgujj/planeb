<script>
    import {enhance} from '$app/forms';
    import {goto} from "$app/navigation";
    import ls from "../../../constant.js";

    /** @type {import('./$types').ActionData} */
    export let form;
</script>
<p>Create a room</p>
<form
        method="post"
        use:enhance={(res) => {
                return async ({ result }) => {
                    if (result.type === 'success' && result?.data?.location) {
                        const moderatorId = localStorage.getItem(ls.itemKeys.id)
                        const moderatorName = localStorage.getItem(ls.itemKeys.name)
                        console.log(cards)
                        if (Object.keys(cards).length < 2) {
                            return
                        }
                        await fetch("/rooms", {
                            method: "POST",
                            body: JSON.stringify({
                                name: result?.data?.name,
                                persisted: result?.data?.persisted,
                                moderator: {
                                    id: moderatorId,
                                    name: moderatorName
                                },
                                cards
                            })
                        })
                        await goto(result?.data?.location.toString());
                    }
                };
            }
        }
>
    {#if form?.nameError}
        <p class="terror">
            {form?.nameError}
        </p>
    {/if}
    <label>Room name: <input name="name" type="text" value={form?.name ?? ""}></label>
    <br>
    <label>Persist room: <input name="persisted" type="checkbox"></label>
    <br>
    <button type="submit">Create</button>
</form>