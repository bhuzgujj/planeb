<script>
    import {onDestroy, onMount} from "svelte";
    import socket from "$lib/net/socket.js";
    import {goto} from "$app/navigation";
    import constants from "../../constant.js";

    /** @type {import('./$types').PageData} */
    export let data;

    let rooms = data.rooms;
    let userId = "";

    /**
     * @param {string} id
     */
    function deleteRoom(id) {
        fetch(`/rooms/${id}`, { method: 'DELETE' })
            .finally(() => {
                rooms.delete(id)
                rooms = rooms
            })
    }

    /**
     * @typedef {import('$lib/network.d.ts').ListEvent} ListEvent
     * @param {ListEvent} update
     */
    function onServerUpdate(update) {
        if (update.action === "remove" && rooms.has(update.id)) {
            rooms.delete(update.id)
        } else {
            rooms.set(update.id, update.evt)
        }
        rooms = rooms
    }

    onMount(() => {
        userId = localStorage.getItem(constants.localStorageKeys.id) ?? ""
        socket.listen(onServerUpdate, {type: "list", data: true, userId})
    })

    onDestroy(() => {
        socket.stopListening(onServerUpdate, {type: "list", data: false, userId})
    })

    /**
     * @param {string} id
     * @param {string} user
     * @returns boolean
     */
    function isOwner(id, user) {
        return rooms.get(id)?.owner === user
    }
</script>

<button on:click={() => goto("/rooms/create")}>Create a new room</button>
<br>
<table style="width: 100%">
    <tr>
        <th>Control</th>
        <th style="padding-left: 10px">Rooms name</th>
    </tr>
    {#each rooms.keys() as id}
        <tr id={id}>
            <td>
                <button on:click={() => deleteRoom(id)} class="bdel"  disabled={!isOwner(id, userId)}>
                    🗑️
                </button>
            </td>
            <td style="width: 100%; padding-left: 10px" on:click={() => goto(`/rooms/${id}`)}>
                {rooms.get(id)?.name}
            </td>
        </tr>
    {/each}
</table>