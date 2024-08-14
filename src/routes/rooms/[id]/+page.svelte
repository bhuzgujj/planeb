<script>
    import ls from "../../../constant.js";
    import {onDestroy, onMount} from "svelte";
    import socket from "$lib/net/socket.js";

    /** @type {import('./$types').PageData} */
    export let data;

    /** @type {string} */
    let userId = ""
    /** @type {string} */
    let userName = ""
    /** @type {Array<import('$lib/data.d.ts').UserInfo>} */
    let users = data.users
    let tasks = data.tasks
    let cards = data.cards
    /** @type {number | null} */
    let voting = null
    let newTask = ""

    /** @type {boolean} */
    $: isMod = users.filter(u => u.id === userId && u.moderator).length >= 1

    /**
     *
     * @param {any} usr
     */
    function putUser(usr) {
        let found = false
        users = users.map(user => {
            if (user.id === usr.id) {
                user = {...user, ...usr}
                found = true
            }
            return user
        })
        if (!found) {
            users.push(usr)
        }
        users = users
    }

    /**
     * @typedef {import('$lib/network.d.ts').RoomEvent} RoomEvent
     * @param {RoomEvent} update
     */
    function onRoomUpdate(update) {
        if (update.evt.user) {
            /** @type any */
            const usr = update.evt.user
            putUser(usr);
        }
    }

    function addTask() {
        if (data.roomInfo.taskRegex) {
            const regex = new RegExp(data.roomInfo.taskRegex)
        }
        fetch(`/rooms/${data.id}/tasks`, {
            method: "POST",
            body: JSON.stringify({

            })
        })
    }

    onMount(() => {
        userId = localStorage.getItem(ls.itemKeys.id) ?? ""
        userName = localStorage.getItem(ls.itemKeys.name) ?? ""
        /** @type {import('$lib/network.d.ts').WebSocketRegisteringEvent<"room">} */
        let subMsg = {
            type: "room",
            userId,
            data: {
                user: {
                    name: userName
                },
                roomId: data.id,
                action: "add"
            }
        };
        putUser({id: userId, name: userName});
        socket.listenToUpdate(onRoomUpdate, subMsg)
    })

    onDestroy(() => {
        /** @type {import('$lib/network.d.ts').WebSocketRegisteringEvent<"room">} */
        const subMsg = {
            type: "room",
            userId,
            data: {
                user: {
                    name: userName
                },
                roomId: data.id,
                action: "add"
            }
        };
        socket.stopListening(onRoomUpdate, subMsg)
    })
</script>

<h1>Welcome to room '{data.roomInfo.name}'</h1>
<div style="display: flex">
    <div style="display: flex; flex-direction: column; width: 80%">
        {#if voting !== null}
            <h2>Currently voting for</h2>
            <div class="cardSelect">
                {#each cards as card}
                    <button class="card">{card.label}</button>
                {/each}
            </div>
        {:else}
            <h2>Waiting for a task to be selected</h2>
        {/if}
    </div>
    <div style="width: 20%">
        <table>
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
</div>

<label>Tasks: <input type="text" bind:value={newTask}><button disabled={!isMod} on:click={() => addTask()}>Add</button></label>
<table style="width: 100%;">
    <tr>
        <th style="width: 10%">Task no</th>
        <th style="width: 80%">Name</th>
        <th style="width: 10%; text-align: center">Voted</th>
    </tr>
    {#if tasks.length > 0}
        {#each tasks as task}
            <tr>
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
<style>
    .cardSelect {
        width: 100%;
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
        align-items: center;
        vertical-align: center;
        margin-right: 20px;
    }

    .card {
        width: 160px;
        height: 300px;
    }
</style>