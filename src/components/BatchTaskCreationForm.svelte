<script>
    /** @type {string} */
    export let regex = ""
    /** @type {import("$lib/data.js").Task[]} */
    export let previews = []
    /** @type {string} */
    let tasks = ""
    $: {
        if (tasks.length > 0) {
            previews = tasks.split("\n")
                .filter(task => task.trim().length !== 0)
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
</script>
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
<style>
    textarea {
        width: 100%;
        height: 32em;
    }
</style>