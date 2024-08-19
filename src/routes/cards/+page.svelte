<script>
    import {goto} from "$app/navigation";
    import {onDestroy, onMount} from "svelte";
    import ls from "../../constant.js";
    import socket from "$lib/net/socket.js";

    /**
     * @typedef {import('$lib/data.d.ts').CardSet} CardSet
     */

    /** @type {import('./$types').ActionData} */
    export let form;

    /** @type {import('./$types').PageData} */
    export let data;

    /** @type {Map<string, CardSet>} **/
    let sets = data.sets;
    let userId = "";

    /**
     * Delete set
     * @param {string} id
     */
    function deleteSet(id) {
        fetch("/cards/" + id, {
            method: "DELETE"
        })
    }

    /**
     * Delete set
     * @typedef {import('$lib/network.d.ts').SetsEvent} SetsEvent
     *
     * @param {SetsEvent} update
     */
    function onServerUpdate(update) {
        if (update.action === "remove" && sets.has(update.id)) {
            sets.delete(update.id)
        } else {
            sets.set(update.id, update.evt)
        }
        sets = sets
    }

    onMount(() => {
        userId = localStorage.getItem(ls.itemKeys.id) ?? ""
        socket.listen(onServerUpdate, {type: "sets", data: true, userId})
    })

    onDestroy(() => {
        socket.stopListening(onServerUpdate, {type: "sets", data: false, userId})
    })
</script>
<form method="post">
    {#if form?.nameError}
        <p class="terror">
            {form?.nameError}
        </p>
    {/if}
    <label>
        Name: <input name="name" type="text" value={form?.name ?? ""} />
    </label>
    <br>
    <button type="submit">Create</button>
</form>
<table style="width: 100%">
    <tr>
        <th>Control</th>
        <th style="padding-left: 10px">Set name</th>
    </tr>
    {#each sets.keys() as id}
        <tr id={id}>
            <td>
                <button on:click={() => deleteSet(id)} class="bdel">
                    🗑️
                </button>
            </td>
            <td style="width: 100%; padding-left: 10px" on:click={() => goto(`/cards/${id}`)}>
                {sets.get(id)?.name}
            </td>
        </tr>
    {/each}
</table>