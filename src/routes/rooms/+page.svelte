<script>
    import {onDestroy, onMount} from "svelte";
    import * as socket from "$lib/socket.js";

    export let data;

    let rooms = data.rooms

    /**
     * @param {string} id
     */
    function deleteRoom(id) {
        fetch("/rooms/" + id, { method: 'DELETE' })
            .finally(() => {
                rooms.delete(id)
                rooms = rooms
            })
    }

    /**
     * @param {ListEvent} update
     */
    function onServerUpdate(update) {
        if (update.type === "remove" && rooms.has(update.id)) {
            rooms.delete(update.id)
        } else {
            rooms.set(update.id, update.room)
        }
        rooms = rooms
    }

    onMount(() => {
        socket.listenToUpdate(onServerUpdate, "list")
    })

    onDestroy(() => {
        socket.stopListening(onServerUpdate)
    })
</script>

<a href="/rooms/create" style="padding: 2px; width: 100%;">Create a new room</a>
<br>
<p>Current rooms</p>
<table style="width: 100%">
    <tr>
        <th>Control</th>
        <th style="padding-left: 10px">Rooms name</th>
    </tr>
    {#each rooms.keys() as id}
        <tr id={id} style="vertical-align: center">
            <td>
                <button on:click={() => deleteRoom(id)} class="bdel" style="margin-bottom: 0px">
                    Delete
                </button>
            </td>
            <td style="width: 100%; vertical-align: center; padding-left: 10px">
                <a href="/rooms/{id}" style="width: 100%">
                    Room: {rooms.get(id)?.name}
                </a>
            </td>
        </tr>
    {/each}
</table>