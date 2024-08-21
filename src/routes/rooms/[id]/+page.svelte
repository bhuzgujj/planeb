<script>
    import constants from "../../../constant.js";
    import {onDestroy, onMount} from "svelte";
    import socket from "$lib/net/socket.js";
    import MainModal from "../../../components/CommentModal.svelte";
    import Graph from "../../../components/Graph.svelte";
    import TaskRow from "./TaskRow.svelte";
    import BatchTaskCreationForm from "../../../components/BatchTaskCreationForm.svelte";

    /** @type {import('./$types').PageData} */
    export let data;

    /** @type {string} */
    let userId = ""
    /** @type {string} */
    let userName = ""
    /** @type {Array<import('$lib/data.d.ts').UserInfo>} */
    let users = data.users
    /** @type {import("$lib/data.js").Task[]} */
    let tasksPreviews = []
    /** @type boolean */
    let creatingTasks = false
    /** @type {boolean} */
    $: voted = users.filter(u => u.vote === undefined || u.vote === null).length < 1
    /** @type {boolean} */
    let overrideVotes = false
    $: {
        overrideVotes = false
        taskIdSelected
    }
    /** @type {Array<import('$lib/data.d.ts').TaskInfo>} */
    let tasks = data.tasks
    /** @type {Array<import('$lib/data.d.ts').Card>} */
    let cards = data.cards
    /** @type {number|null} */
    let taskIdSelected = null
    /** @type {import('$lib/data.d.ts').TaskInfo|null} */
    $: taskSelected = taskIdSelected !== null ? tasks[taskIdSelected] : null
    /** @type string */
    let newTask = ""
    /** @type {string|null} */
    let taskCommenting = null
    /** @type {string|null} */
    let prevCommentTask = null
    /** @type {string|null} */
    let acceptedCard = null
    /** @type {boolean} */
    $: isMod = users.filter(u => u.id === userId && u.moderator).length >= 1
    /** @type {import('$lib/data.d.ts').Card | null} */
    let cardSelected = null
    $: showCommentModal = taskCommenting != null
    let comments = ""
    $: showResultEnable = isMod && taskIdSelected !== null;
    $: {
        if (taskCommenting !== null && prevCommentTask !== taskCommenting) {
            comments = tasks.find(task => task.id === taskCommenting)?.comments ?? ""
            prevCommentTask = taskCommenting
        }
    }

    function closeComment() {
        taskCommenting = null
    }

    /**
     * Notification of a change on a user
     * @param {any} usr
     */
    function putUser(usr) {
        let found = false
        for (let i = 0; i < users.length; i++){
            if (users[i].id === usr.id) {
                users[i] = {...users[i], ...usr}
                found = true
                break
            }
        }
        if (!found) {
            users.push(usr)
        }
        users = users
    }

    /**
     * Notification of a change on a task
     * @param {any} tsk
     */
    function putTask(tsk) {
        let found = false
        switch (tsk.action) {
            case "remove":
                tasks = tasks.filter(t => t.id !== tsk.id)
                break;
            default:
                tasks = tasks.map(task => {
                    if (task.id === tsk.id) {
                        task = {...task, ...tsk.evt}
                        found = true
                    }
                    return task
                })
                if (!found) {
                    tasks.push({
                        id: tsk.id,
                        name: tsk.evt.name,
                        no: tsk.evt.no
                    })
                }
                tasks = tasks
                break;
        }
    }

    /**
     * Notification of a change on a vote
     * @param {any} voting
     */
    function putVoting(voting) {
        selectTaskToVoteFor(voting.taskId)
        if (voting.taskId && voting.show === undefined) {
            for (let i = 0; i < users.length; i++) {
                users[i].vote = undefined
            }
            cardSelected = null
        }
        if (voting.voted) {
            for (let i = 0; i < users.length; i++) {
                for (const [id, vote] of Object.entries(voting.voted)) {
                    if (users[i].id === id) {
                        users[i].vote = vote
                        break
                    }
                }
            }
        }
        if (voting.show && taskIdSelected !== null && voting.taskId === tasks[taskIdSelected].id) {
            overrideVotes = true
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
        if (update.evt.task) {
            /** @type any */
            const tsk = update.evt.task
            putTask(tsk);
        }
        if (update.evt.voting) {
            /** @type any */
            const voting = update.evt.voting
            putVoting(voting)
        }
    }

    /**
     * Create a task in the current room
     */
    function addTask() {
        /** @type {string | undefined} */
        let no;
        /** @type {string} */
        let name = newTask.trim();
        if (data.roomInfo.taskRegex) {
            const matchs = name.match(data.roomInfo.taskRegex)
            if (matchs) {
                no = matchs[0]
            }
        }
        /** @type {import("$lib/data.js").Task} */
        const body = {
            no,
            name
        }
        saveTaskCreation([body])
    }

    /**
     * Select task for voting
     * @param {string} id
     */
    function selectTaskToVoteFor(id) {
        if (id === taskSelected?.id) {
            return
        }
        /** @type {import('$lib/data.d.ts').TaskInfo|null} */
        for (let i = 0; i < tasks.length; i++) {
            if (tasks[i].id === id) {
                taskIdSelected = i
                socket.send({
                    taskId: id,
                    roomId: data.id
                }, "votes")
                break;
            }
        }
    }

    /**
     * Delete task
     * @param {string} id
     */
    function deleteTask(id) {
        if (id === taskSelected?.id) {
            return
        }
        fetch(`/rooms/${data.id}/tasks/${id}`, {
            method: "DELETE",
            body: JSON.stringify({
                userId: userId,
            })
        })
            .then(() => next())
    }

    function next() {
        if (taskIdSelected !== null) {
            if (taskIdSelected + 1 < tasks.length) {
                taskIdSelected += 1
                taskIdSelected = taskIdSelected
            } else {
                taskIdSelected = null;
            }
        }
        socket.send({
            taskId: taskIdSelected !== null ? tasks[taskIdSelected].id : null,
            roomId: data.id
        }, "votes")
    }

    function previous() {
        if (taskIdSelected !== null && taskIdSelected - 1 >= 0) {
            taskIdSelected -= 1
            taskIdSelected = taskIdSelected
        }
        socket.send({
            taskId: taskIdSelected !== null ? tasks[taskIdSelected].id : null,
            roomId: data.id
        }, "votes")
    }

    /**
     *
     * @param {import('$lib/data.d.ts').Card | null} card
     */
    function changeVote(card) {
        cardSelected = card
        if (card !== null && taskSelected !== null) {
            fetch(`/rooms/${data.id}/tasks/${taskSelected.id}/${userId}`, {
                method: "PATCH",
                body: JSON.stringify({
                    cardId: card.id
                })
            })
        }
    }

    /**
     *
     * @param {import("$lib/data.js").UserInfo} user
     */
    function showVote(user) {
        if (voted) {
            return cards.find(card => card.id === user.vote)?.label ?? "?"
        } else {
            return "?"
        }
    }

    function acceptCard() {
        if (taskSelected) {
            fetch(`/rooms/${data.id}/tasks/${taskSelected.id}`, {
                method: "PATCH",
                body: JSON.stringify({
                    userId: userId,
                    cardId: acceptedCard
                })
            })
                .then(() => {
                    next()
                    acceptedCard = null
                })
        }
    }

    function showResult() {
        if (taskIdSelected !== null) {
            socket.send({
                taskId: tasks[taskIdSelected].id,
                roomId: data.id
            }, "result")
        }
    }

    function saveComment() {
        const task = tasks.find(task => task.id === taskCommenting)
        if (task) {
            fetch(`/rooms/${data.id}/tasks/${task.id}`, {
                method: "PATCH",
                body: JSON.stringify({
                    userId: userId,
                    comment: comments
                })
            });
            closeComment()
        } else {
            console.error("Cannot save comment to a non existing task")
        }
    }

    /**
     *
     * @param {import("$lib/data.js").UserInfo} user
     */
    function toggleMod(user) {
        fetch(`/rooms/${data.id}`, {
            method: "PATCH",
            body: JSON.stringify({
                userId: userId,
                targetId: user.id,
                moderator: !user.moderator
            })
        })
    }

    /**
     *
     * @param {import("$lib/data.js").UserInfo} user
     */
    function canActOn(user) {
        return isMod && data.roomInfo.owner !== user.id && user.id !== userId
    }

    function closeTaskCreation() {
    }

    /**
     * @param {import("$lib/data.js").Task[]} tasks
     */
    function saveTaskCreation(tasks) {
        fetch(`/rooms/${data.id}/tasks`, {
            method: "POST",
            body: JSON.stringify({
                userId: userId,
                tasks
            })
        })
    }

    onMount(() => {
        console.log(data)
        userId = localStorage.getItem(constants.localStorageKeys.id) ?? ""
        userName = localStorage.getItem(constants.localStorageKeys.name) ?? ""
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
        socket.listen(onRoomUpdate, subMsg)
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
    <div style="display: flex; flex-direction: column; width: 80%; margin-right: 1rem">
        {#if (voted || overrideVotes) && taskSelected !== null}
            <h2>End of voting for {taskSelected.name}</h2>
            <Graph users={users} cards={cards} />
            <label>Selected points:
                <select bind:value={acceptedCard}>
                    {#each cards as card}
                        <option value={card.id}>{card.label}</option>
                    {/each}
                </select>
                <button on:click={() => acceptCard()} disabled={acceptedCard===null || !isMod}>Save</button>
            </label>
        {:else if taskSelected !== null}
            <h2>Voting for {taskSelected.name}</h2>
            <div class="cardSelect">
                {#each cards as card}
                    <button class="card" on:click={() => changeVote(card)}
                            disabled={cardSelected === card}>{card.label}</button>
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
                <th style="text-align: end">Mod</th>
            </tr>
            {#if users.length > 0}
                {#each users as user}
                    {#if user.vote === null || user.vote === undefined}
                        <tr class="voting">
                            <td style="width: 80%">{user.name}</td>
                            <td style="text-align: center">?</td>
                            <td style="text-align: center; vertical-align: center">
                                <input type="checkbox" checked={user.moderator} disabled={!canActOn(user)} on:click={() => toggleMod(user)}>
                            </td>
                        </tr>
                    {:else if user.vote !== null && user.vote !== undefined}
                        <tr class="voteCompleted">
                            <td style="width: 80%">{user.name}</td>
                            <td style="text-align: center">{showVote(user)}</td>
                            <td style="text-align: center; vertical-align: center">
                                <input type="checkbox" checked={user.moderator} disabled={!canActOn(user)} on:click={() => toggleMod(user)}>
                            </td>
                        </tr>
                    {:else }
                        <tr>
                            <td style="width: 80%">{user.name}</td>
                            <td style="text-align: center">?</td>
                            <td style="text-align: center; vertical-align: center">
                                <input type="checkbox" checked={user.moderator} disabled={!canActOn(user)} on:click={() => toggleMod(user)}>
                            </td>
                        </tr>
                    {/if}
                {/each}
            {:else}
                <tr>
                    <td style="text-align: center" colspan="2">Empty</td>
                </tr>
            {/if}
        </table>
    </div>
</div>

<div style="display: flex; justify-content: space-between; margin-top: 10px">
    <label>Tasks: <input type="text" bind:value={newTask}>
        <button disabled={!isMod} on:click={() => addTask()}>Add</button>
    </label>
    <button disabled={!isMod} on:click={() => creatingTasks = !creatingTasks}>Batch add task</button>
    <div style="height: 100%">
        <button style="height: 100%" disabled={!showResultEnable} on:click={() => showResult()}>Show result</button>
    </div>
    <div style="height: 100%">
        <button style="height: 100%" disabled={!isMod} on:click={() => previous()}>Previous</button>
        <button style="height: 100%" disabled={!isMod} on:click={() => next()}>Next</button>
    </div>
</div>
<table style="width: 100%;">
    <tr>
        <th style="width: 10%"></th>
        <th style="width: 10%">Task no</th>
        <th style="width: 70%">Name</th>
        <th style="width: 10%; text-align: center">Voted</th>
    </tr>
    {#if tasks.length > 0}
        {#each tasks as task}
            {#if task.vote !== undefined && task.vote !== null}
                <TaskRow
                        bind:taskCommenting={taskCommenting}
                        cards={cards}
                        isMod={isMod}
                        selectTask={() => selectTaskToVoteFor(task.id)}
                        deleteTask={() => deleteTask(task.id)}
                        task={task}
                        rowClass="voteCompleted"
                />
            {:else if task.id === taskSelected?.id}
                <TaskRow
                        bind:taskCommenting={taskCommenting}
                        cards={cards}
                        isMod={isMod}
                        selectTask={() => selectTaskToVoteFor(task.id)}
                        deleteTask={() => deleteTask(task.id)}
                        task={task}
                        rowClass="voting"
                />
            {:else}
                <TaskRow
                        bind:taskCommenting={taskCommenting}
                        cards={cards}
                        isMod={isMod}
                        selectTask={() => selectTaskToVoteFor(task.id)}
                        deleteTask={() => deleteTask(task.id)}
                        task={task}
                />
            {/if}
        {/each}
    {:else}
        <tr>
            <td style="text-align: center;" colspan="4">Empty</td>
        </tr>
    {/if}
</table>
<MainModal
        bind:show={showCommentModal}
        onClose={closeComment}
        onSave={saveComment}
>
    <h2 slot="header">
        Comments for {tasks.find(task => task.id === taskCommenting)?.name ?? "UNKNOWN"}
    </h2>
    <div style="width: 100%">
        <textarea bind:value={comments} style="width: 100%"></textarea>
    </div>
</MainModal>
<MainModal
        bind:show={creatingTasks}
        onClose={closeTaskCreation}
        onSave={() => saveTaskCreation(tasksPreviews)}
>
    <h2 slot="header">
        Batch add tasks
    </h2>
    <div style="width: 100%; height: 40em">
        <BatchTaskCreationForm
                bind:previews={tasksPreviews}
                regex={data.roomInfo.taskRegex}
        />
    </div>
</MainModal>

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

    .voteCompleted > td {
        background-color: #00aa0050;
    }

    .voting > td {
        background-color: #aaaa0050;
    }
</style>