<script>
    import {goto} from "$app/navigation";

    /** */
    export let data;

    /** @type {{[id: string]: {value: string, label: string}}} */
    let cards = data.cardSet.cards.reduce((/** @type {{[id: string]: {value: string, label: string}}} */ acc, /** @type {import('$lib/data.d.ts').Card} */ prev) => {
        acc[prev.id] = {
            value: prev.value.toString(),
            label: prev.label
        }
        return acc
    }, {});
    let name = data.cardSet.name
    let id = data.id

    function submit() {
        fetch(`/cards/${data.id}`, {
            method: "PUT",
            body: JSON.stringify({
                id,
                name,
                cards: Object.entries(cards).reduce((/** @type any */acc, [k, v])=>{
                    const items = {
                        id: k,
                        value: parseFloat(v.value),
                        label: v.label
                    };
                    acc.push(items);
                    return acc;
                },  [])
            })
        })
            .then(() => goto("/cards"))
    }
    $: isSendable = Object.keys(cards).length > 1 &&
        Object.values(cards)
            .filter(c => c.label.trim().length === 0)
            .length === 0 &&
        Object.values(cards)
            .filter(c => isNaN(parseFloat(c.value)))
            .length === 0

</script>
<label>
    Set Name: <input type="text" bind:value={name}/>
</label>
<p>Cards:</p>
<button on:click={() => {cards[crypto.randomUUID()] = {label:"", value: "0"}}}>Add</button>
<table style="width: 100%">
    <tr>
        <th>Control</th>
        <th>Points value</th>
        <th>Card label text</th>
    </tr>
    {#if Object.keys(cards).length>0}
        {#each Object.keys(cards) as card}
            <tr style="vertical-align: center">
                <td><button class="bdel" on:click={() => {
                        delete cards[card]
                        cards = cards
                    }} disabled={Object.keys(cards).length <= 2}>Remove</button></td>
                <td><input bind:value={cards[card].value}></td>
                <td><input bind:value={cards[card].label}></td>
            </tr>
        {/each}
    {:else}
        <tr style="vertical-align: center">
            <td style="text-align: center;" colspan="3">Empty</td>
        </tr>
    {/if}
</table>
<button on:click={() => {submit()}} disabled={!isSendable}>Submit</button>