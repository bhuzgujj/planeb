<script>
    /** @type {import("$lib/data.js").Card[]} */
    export let cards;
    /** @type {boolean} */
    export let showValue = true
    /** @type {import("$lib/data.js").Card | null} */
    export let selected = null;
    /** @type {function(import("$lib/data.js").Card):void} */
    export let select = (card) => {};

    /**
     *
     * @param {number} number
     * @param {number} max
     * @return string
     */
    function getRed(number, max) {
        const half = max / 2
        const quarter = half / 2
        if (number > half)
            return "0";
        if (number < quarter)
            return ((number/quarter) * 255).toFixed(0);
        else
            return ((2 - (number/quarter)) * 255).toFixed(0);
    }

    /**
     *
     * @param {number} number
     * @param {number} max
     * @return string
     */
    function getGreen(number, max) {
        const third = max / 3
        const half = max / 2
        const quarter = half / 2
        if (number < third || number > third + half)
            return "0";
        const num = number - third;
        if (num < quarter)
            return ((num/quarter) * 255).toFixed(0);
        else
            return ((2 - (num/quarter)) * 255).toFixed(0);
    }

    /**
     *
     * @param {number} number
     * @param {number} max
     * @return string
     */
    function getBlue(number, max) {
        const third = max / 3
        const half = max / 2
        const quarter = half / 2
        if (number < third * 2)
            return "0";
        const num = number - (third * 2);
        if (num < quarter)
            return ((num/quarter) * 255).toFixed(0);
        else
            return ((2 - (num/quarter)) * 255).toFixed(0);
    }

    /**
     *
     * @param {number} number
     * @param {number} max
     * @return string
     */
    function getColor(number, max) {
        let r = getRed(number, max);
        let g = getGreen(number, max);
        let b = getBlue(number, max);
        return `rgba(${r},${g},${b},75)`;
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
                    style="background: {getColor(number + 1, cards.length)}"
                    disabled={card.id === selected?.id}
                    on:click={() => onSelect(card)}
            >
                <div class="cscardcontainer">
                    {#if card.value.toString() === card.label}
                        <p>{card.label}</p>
                    {:else}
                        <p>{card.label}</p>
                        {#if showValue}
                            <p>Value: {card.value}</p>
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
        flex-direction: column;
    }

    .setname {
        width: 100%;
    }

    p {
        background: transparent;
        -webkit-user-select: none;
        -ms-user-select: none;
        user-select: none;
        font-weight: normal;
        font-style: italic;
        font-size: 15px;
    }

    p:first-child {
        font-weight: bold;
        font-style: normal;
        font-size: 20px;
    }
</style>