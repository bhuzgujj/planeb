<script>
    import {enhance} from '$app/forms';
    import {goto} from "$app/navigation";
    import ls from "../../../constant.js";

    /** @type {import('./$types').ActionData} */
    export let form;
    /** @type {import('./$types').PageData} */
    export let data;

    const sets = data.sets
    /** @type {string | null} */
    let selectedSet = null
</script>
<p>Create a room</p>
<form
        method="post"
        use:enhance={(res) => {
                return async ({ result }) => {
                    if (result.type === 'success' && result?.data?.location) {
                        const moderatorId = localStorage.getItem(ls.itemKeys.id)
                        const moderatorName = localStorage.getItem(ls.itemKeys.name)
                        await fetch("/rooms", {
                            method: "POST",
                            body: JSON.stringify({
                                name: result?.data?.name,
                                persisted: result?.data?.persisted,
                                moderator: {
                                    id: moderatorId,
                                    name: moderatorName
                                },
                                cards: result?.data?.cards,
                                taskPrefix: result?.data?.taskPrefix
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
    <label>Task number prefix: <input name="task_prefix" type="text"></label>
    <br>
    {#if form?.setError}
        <p class="terror">
            {form?.setError}
        </p>
    {/if}
    <label>Selected Cards:
        <select name="sets" bind:value={selectedSet}>
            {#each sets.keys() as id}
                <option value={id}>{sets.get(id)?.name}</option>
            {/each}
        </select>
    </label>
    <br>
    <table style="width: 100%">
        <tr>
            <th>Label</th>
            <th style="padding-left: 10px">Value</th>
        </tr>
        {#if selectedSet !== null}
            {#each sets.get(selectedSet)?.cards ?? [] as card}
                <tr id={card.id}>
                    <td>
                        {card.label}
                    </td>
                    <td>
                        {card.value}
                    </td>
                </tr>
            {/each}
        {:else}
            <tr>
                <td style="text-align: center;" colspan="2">Select a card set</td>
            </tr>
        {/if}
    </table>
    <button type="submit">Create</button>
</form>