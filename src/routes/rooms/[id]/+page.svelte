<script>
    import ls from "../../../constant.js";
    import {onDestroy, onMount} from "svelte";
    import socket from "$lib/net/socket.js";

    export let data;

    /** @type {string} */
    let userId = ""
    /** @type {Array<import('$lib/data.d.ts').UserInfo>} */
    let users = data.users
    let tasks = data.tasks

    /** @type {boolean} */
    $: isMod = users.filter(u => u.id === userId && u.moderator).length >= 1

    /**
     * @typedef {import('$lib/network.d.ts').UserEvent} UserEvent
     * @param {UserEvent} update
     */
    function onUserUpdate(update) {
        users = users.map(user => {
            if (user.id === update.id) {
                user = {...user, ...update.evt}
            }
            return user
        })
    }

    onMount(() => {
        userId = localStorage.getItem(ls.itemKeys.id) ?? ""
        let userName = localStorage.getItem(ls.itemKeys.name) ?? ""
        socket.listenToUpdate(onUserUpdate, {
            type: "user",
            userId,
            focused: {
                id: data.id,
                user: {
                    id: userId,
                    name: userName
                }
            }
        })
    })

    onDestroy(() => {
        socket.stopListening(onUserUpdate, {type: "user", unfocused: data.id})
    })
</script>

<h1>Welcome to room '{data.roomInfo.name}'</h1>
<div style="display: flex">
    <div style="width: 80%">LOL</div>
    <table style="width: 20%">
        <tr>
            <th style="text-align: start">Name</th>
            <th style="text-align: end">Points</th>
        </tr>
        {#if users.length > 0}
            {#each users as user}
                <tr>
                    <td style="width: 80%">{user.name}</td>
                    <td style="text-align: center">{user.vote ?? '?'}</td>
                </tr>
            {/each}
        {:else}
            <tr>
                <td style="text-align: center" colspan="2">Empty</td>
            </tr>
        {/if}
    </table>
</div>

<button disabled={!isMod}>Add tasks</button>
<table style="width: 100%">
    <tr>
        <th style="width: 10%">Task no</th>
        <th style="width: 80%">Name</th>
        <th style="width: 10%; text-align: center">Voted</th>
    </tr>
    {#if tasks.length > 0}
        {#each tasks as task}
            <tr style="vertical-align: center">
                <td>{task.no}</td>
                <td>{task.name}</td>
                <td style="text-align: center">{task.vote ?? '?'}</td>
            </tr>
        {/each}
    {:else}
        <tr>
            <td style="text-align: center;" colspan="3">Empty</td>
        </tr>
    {/if}
</table>