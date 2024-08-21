<script>
    import {enhance} from '$app/forms';
    import {goto} from "$app/navigation";
    import constants from "../../../constant.js";

    /** @type {import('./$types').ActionData} */
    export let form;
    /** @type {import('./$types').PageData} */
    export let data;

    const sets = data.sets
    /** @type {string} */
    let tasks = ""
    /** @type {string} */
    let regex = ""
    /** @type {import("$lib/data.js").Task[]} */
    let previews = []
    $: {
        if (tasks.length > 0) {
            previews = tasks.split("\n")
                .map(task => {
                    let no;
                    const matchs = task.trim().match(regex)
                    if (matchs) {
                        no = matchs[0]
                    }
                    return {
                        name: task.trim(),
                        no
                    }
                });
        } else {
            previews = []
        }
    }
    console.log(previews)
    /** @type {string | null} */
    let selectedSet = null
</script>
<h1>Create a room</h1>
<br>
<form
        method="post"
        use:enhance={(res) => {
                return async ({ result }) => {
                    if (result.type === 'success' && result?.data?.location) {
                        const moderatorId = localStorage.getItem(constants.localStorageKeys.id)
                        const moderatorName = localStorage.getItem(constants.localStorageKeys.name)
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
                                taskPrefix: result?.data?.taskPrefix,
                                tasks: previews
                            })
                        })
                        await goto(result?.data?.location.toString());
                    }
                };
            }
        }
        style="width: 100%; display: flex; justify-content: space-between"
>
    <div style="width:45%;">
        <h2>Room info</h2>
        {#if form?.nameError}
            <p class="terror">
                {form?.nameError}
            </p>
        {/if}
        <label>Room name<br><input name="name" type="text" value={form?.name ?? ""}></label>
        <br style="margin-bottom: 15px">
        <label>Persist room: <input name="persisted" type="checkbox"></label>
        <br style="margin-bottom: 15px">
        <label>Task number prefix (regex)<br><input name="task_prefix" type="text" bind:value={regex}></label>
        <br style="margin-bottom: 15px">
        {#if form?.setError}
            <p class="terror">
                {form?.setError}
            </p>
        {/if}
        <label>Selected Cards<br>
            <select name="sets" bind:value={selectedSet}>
                {#each sets.keys() as id}
                    <option value={id}>{sets.get(id)?.name}</option>
                {/each}
            </select>
        </label>
        <br style="margin-bottom: 15px">
        <table style="width: 100%">
            <thead>
                <tr>
                    <th style="width: 75%">Label</th>
                    <th style="padding-left: 10px">Value</th>
                </tr>
            </thead>
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
    </div>
    <div style="width: 50%">
        <h2>Tasks</h2>
        <br>
        <textarea bind:value={tasks}/>

        <table style="width: 100%">
            <thead>
            <tr>
                <th style="width: 25%">Number from regex</th>
                <th style="padding-left: 10px; width: 75%">Name</th>
            </tr>
            </thead>
            {#if previews.length > 0}
                {#each previews as task}
                    <tr>
                        <td>
                            {task.no ?? ""}
                        </td>
                        <td>
                            {task.name}
                        </td>
                    </tr>
                {/each}
            {:else}
                <tr>
                    <td style="text-align: center;" colspan="2">No task</td>
                </tr>
            {/if}
        </table>
    </div>
</form>

<style>
    label {
        width: 300px;
    }

    tr > td {
        text-align: center;
    }

    tr > th {
        text-align: center;
    }

    textarea {
        width: 100%;
        height: 100%;
    }

    input[type=text] {
        width: 100%;
    }
</style>