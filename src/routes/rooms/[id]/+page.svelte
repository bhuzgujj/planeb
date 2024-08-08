<script>
    export let data;

    let users = data.users
    let tasks = data.tasks
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
                    <td>{user.name}</td>
                    <td>{user.vote}</td>
                </tr>
            {/each}
        {:else}
            <tr>
                <td style="text-align: center" colspan="2">Empty</td>
            </tr>
        {/if}
    </table>
</div>

<button>Add tasks</button>
<table style="width: 100%">
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
                <td>{task.vote}</td>
            </tr>
        {/each}
    {:else}
        <tr>
            <td style="text-align: center;" colspan="3">Empty</td>
        </tr>
    {/if}
</table>