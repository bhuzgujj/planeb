<script>
    import {enhance, applyAction} from '$app/forms';
    import {goto} from "$app/navigation";

    /** @type {import('./$types').ActionData} */
    export let form;
</script>
<p>Create a room</p>
<form
        method="post"
        use:enhance={(res) => {
                return async ({ result }) => {
                    if (result.type === 'success' && result?.data?.location) {
                        await fetch("/rooms", {method: "POST", body: JSON.stringify({
                            name: result?.data?.name,
                            persisted: result?.data?.persisted
                        })})
                        await goto(result?.data?.location.toString());
                    }
                };
            }
        }
>
    {#if form?.name?.missing}
        <p class="terror">
            Require a room name
        </p>
    {/if}
    <label>Room name: <input name="name" type="text" value={form?.name ?? ""}/></label>
    <br>
    <label>Persist room: <input name="persisted" type="checkbox"></label>
    <br>
    <button type="submit">Create</button>
</form>