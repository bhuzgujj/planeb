<script>
    import {rooms} from "../../stores/rooms.store.js";

    export let data;

    let roomss = data.rooms
    $: rooms


    /**
     * @param {string} id
     */
    function deleteRoom(id) {
        fetch("/rooms/" + id, { method: 'DELETE' })
            .finally(() => {
                roomss.delete(id)
                roomss = roomss
            })
    }
</script>

<a href="/rooms/create" style="padding: 2px; width: 100%;">Create a new room</a>
<br>
<p>Current rooms</p>
<table style="width: 100%">
    <tr>
        <th>Control</th>
        <th style="padding-left: 10px">Rooms name</th>
    </tr>
    {#each roomss.keys() as id}
        <tr id={id} style="vertical-align: center">
            <td>
                <button on:click={() => deleteRoom(id)} class="bdel" style="margin-bottom: 0px">
                    Delete
                </button>
            </td>
            <td style="width: 100%; vertical-align: center; padding-left: 10px">
                <a href="/rooms/{id}" style="width: 100%">
                    Room: {roomss.get(id)?.name}
                </a>
            </td>
        </tr>
    {/each}
</table>