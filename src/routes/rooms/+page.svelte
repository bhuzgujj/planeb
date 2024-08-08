<script>
    import {onDestroy, onMount} from "svelte";
    import {listenToUpdate, stopListening} from "$lib/socket.js";
    import {goto} from "$app/navigation";

    export let data;

    let rooms = data.rooms;

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
     * @param {any} update
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
        listenToUpdate(onServerUpdate, "list")
    })

    onDestroy(() => {
        stopListening(onServerUpdate)
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
            <td style="width: 100%; vertical-align: center; padding-left: 10px" on:click={() => goto(`/rooms/${id}`)}>
                Room: {rooms.get(id)?.name}
            </td>
        </tr>
    {/each}
</table>