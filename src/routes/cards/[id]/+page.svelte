<script>
    
    /** @type {{[id: string]: {val: number, label: string}}} */
    let cards = { [crypto.randomUUID()]: {val: 0, label: ""}};

</script>
<p>Cards:</p>
<button on:click={() => {
        cards[crypto.randomUUID()] = {label:"", val:0}
    }}>Add</button>
<table>
    <tr>
        <th></th>
        <th>Points value</th>
        <th>Card label text</th>
    </tr>
    {#each Object.keys(cards) as card}
        <tr>
            <td><button class="bdel" on:click={() => {
                    delete cards[card]
                    cards = cards
                }} disabled={Object.keys(cards).length <= 1}>Remove</button></td>
            <td><input bind:value={cards[card].val}></td>
            <td><input bind:value={cards[card].label}></td>
        </tr>
    {/each}
</table>

<style>
    tr:hover {
        background: #171717;
    }

    tr:hover > td {
        background: #171717;
    }

    tr > td > * {
        padding-bottom: 0;
        margin-bottom: 0;
    }
</style>