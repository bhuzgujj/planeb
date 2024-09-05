<script>
    import {goto} from "$app/navigation";
    import { createId } from '../../../idGenerator.js';

    /** @type {import('./$types').PageData} */
    export let data;

    /** @type {{[id: string]: {value: string, label: string, sync: boolean}}} */
    let cards = data.cardSet.cards.reduce((/** @type {{[id: string]: {value: string, label: string, sync: boolean}}} */ acc, /** @type {import('$lib/data.d.ts').Card} */ prev) => {
        acc[prev.id] = {
            value: prev.value.toString(),
            label: prev.label,
            sync: false
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

    function createNewEntry() {
        /** @type {any} */
        cards[createId()] = {label:"0", value: "0", sync: true}
    }

    /**
     *
     * @param {string} id
     */
    function deleteCard(id) {
        delete cards[id]
        cards = cards
    }
</script>
<label>
    Set Name: <input type="text" bind:value={name}/>
</label>
<br style="margin-bottom: 15px">
<button on:click={() => createNewEntry()}>Add Card</button>
<table style="width: 100%">
    <tr>
        <th style="width: 5%"></th>
        <th>Points value</th>
        <th>Card label text</th>
    </tr>
    {#if Object.keys(cards).length>0}
        {#each Object.keys(cards) as card}
            <tr>
                <td style="text-align: center">
                    <button class="bdel" on:click={() => deleteCard(card)} disabled={Object.keys(cards).length <= 2}>
                        🗑️
                    </button>
                </td>
                <td><input bind:value={cards[card].value} on:input={(e) => {
                    if (cards[card].sync){
                        cards[card].label = cards[card].value
                    }
                }}></td>
                <td><input bind:value={cards[card].label} on:input={(e) => {cards[card].sync = false}}></td>
            </tr>
        {/each}
    {:else}
        <tr>
            <td style="text-align: center;" colspan="3">Empty</td>
        </tr>
    {/if}
</table>
<button on:click={() => {submit()}} disabled={!isSendable}>Submit</button>

<style>
    input {
        border: none;
        background: transparent;
    }
</style>
