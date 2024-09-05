<script>
    /** @type {import("$lib/data.js").Card[]} */
    export let cards;
    /** @type {boolean} */
    export let showValue = false
    /** @type {import("$lib/data.js").Card | null} */
    export let selected = null;
    /** @type {function(import("$lib/data.js").Card):void} */
    export let select = (card) => {};
    $: max = cards.length + 2
    $: third = max / 3
    $: half = max / 2

    /**
     *
     * @param {number} number
     * @return string
     */
    function getRed(number) {
        if (number > half)
            return "0";
        return ((number/half) * 10).toFixed(0);
    }

    /**
     *
     * @param {number} number
     * @return string
     */
    function getGreen(number) {
        if (number < third)
            return "0";
        return (((number - third)/half) * 10).toFixed(0);
    }

    /**
     *
     * @param {number} number
     * @return string
     */
    function getBlue(number) {
        if (number < third * 2)
            return "0";
        return (((number - third * 2)/half) * 10).toFixed(0);
    }

    /**
     *
     * @param {number} number
     * @return string
     */
    function getColor(number) {
        let r = getRed(number);
        let g = getGreen(number);
        let b = getBlue(number);
        return `#${r}${g}${b}`;
    }

    /**
     *
     * @param {import("$lib/data.js").Card} card
     */
    function onSelect(card) {
        select(card)
    }
</script>

<div class="cscontainer">
    <div class="setname">
        <slot/>
    </div>
    <div class="cscards">
        {#each cards as card, number}
            <button 
                    class="cscard" 
                    style="background: {getColor(number + 1)}"
                    disabled={card.id === selected?.id}
                    on:click={() => onSelect(card)}
            >
                <div class="cscardcontainer">
                    {#if card.value.toString() === card.label}
                        <p>{card.label}</p>
                    {:else}
                        <p>{card.label}</p>
                        {#if showValue}
                            <p>{card.value}</p>
                        {/if}
                    {/if}
                </div>
            </button>
        {/each}
    </div>
</div>

<style>
    * {
        transition: 0.2s;
    }

    .cscontainer {
        width: 100%;
        height: 100%;
        border-radius: 10px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .cscards {
        display: flex;
        width: 100%;
        flex-grow: 1;
    }

    .cscard {
        height: 100%;
        flex: 1;
        display: flex;
        flex-direction: column;
        font-weight: 600;
        border: none;
        border-radius: 0;
        padding: 0;
        margin: 0;
    }

    .cscard:hover {
        flex: 2;
    }

    .cscard:disabled > div > p {
        color: #666;
    }

    .cscard:disabled > .cscardcontainer {
        background: #444;
    }

    .cscard:disabled {
        flex: 2;
        border: 2px solid #666;
        background: #444;
    }

    .cscardcontainer {
        height: 100%;
        width: 100%;
        background: transparent;
        align-items: center;
        justify-content: center;
        display: flex;
    }

    .setname {
        width: 100%;
    }

    p {
        background: transparent;
        -webkit-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }
</style>