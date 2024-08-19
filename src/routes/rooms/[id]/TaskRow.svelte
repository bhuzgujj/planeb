<script>
    /** @type {boolean} */
    export let isMod;
    /** @type {string | null} */
    export let taskCommenting;
    /** @type {import("$lib/data").TaskInfo} */
    export let task;
    /** @type {import("$lib/data").Card[]} */
    export let cards;
    /** @type {() => void} */
    export let selectTask;
    /** @type {() => void} */
    export let deleteTask;
    /** @type {string} */
    export let rowClass = ""
</script>

<tr class={rowClass}>
    <td>
        <button class="bdel" disabled={!isMod} on:click={() => deleteTask()}>
            🗑️
        </button>
        <button disabled={!isMod} on:click={() => {taskCommenting = task.id}}>
            🗨️
        </button>
        <button disabled={!isMod} on:click={() => {selectTask()}}>
            ✅
        </button>
    </td>
    <td>{task.no ?? ""}</td>
    <td>{task.name}</td>
    <td style="text-align: center">{cards.find(card => card.id === task.vote)?.label ?? "?"}</td>
</tr>
<style>
    .voteCompleted > td {
        background-color: #00aa0050;
    }

    .voting > td {
        background-color: #aaaa0050;
    }

    button {
        padding-right: 5px;
        padding-left: 5px;
    }
</style>