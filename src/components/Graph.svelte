<script>
    import { scaleLinear } from 'd3-scale';

    /** @type {import("$lib/data.js").Card[]} */
    export let cards;
    /** @type {import("$lib/data.js").UserInfo[]} */
    export let users;
    export let width = 400;
    export let height = 350;
    export let numberOfSteps = 5;

    /** @type {(import("$lib/data.js").Card| undefined)[] } */
    $: usersCards = users.map(u => cards.find(c => c.id === u.vote))

    /** @type {Map<string, number>} */
    $: points = cards.reduce((acc, c) => {
        let value = 0
        for (const card of usersCards) {
            if (card !== undefined && card.id === c.id)
                value++
        }
        acc.set(c.label, value)
        return acc
    }, new Map())

    $: average = (usersCards.reduce((acc, card) => {
        if (card !== undefined)
            acc += card.value
        return acc
    }, 0) / users.length).toFixed(2)
    const step = Math.ceil(users.length / 5)

    /**
     *
     * @param {number} step
     */
    function steps(step) {
        const s = []
        for (let i = 1; i - 1 < numberOfSteps; i++) {
            s.push(i * step)
        }
        return s;
    }

    const yTicks = steps(step)
    const padding = { top: 20, right: 15, bottom: 20, left: 25 };

    $: xScale = scaleLinear()
        .domain([0, points.size])
        .range([padding.left, width - padding.right]);

    let yScale = scaleLinear()
        .domain([0, Math.max.apply(null, yTicks)])
        .range([height - padding.bottom, padding.top]);

    $: innerWidth = width - (padding.left + padding.right);
    $: barWidth = innerWidth / points.size;
</script>
<div class="chart" bind:clientWidth={width}>
    <svg {width} {height}>
        <g class="bars">
            {#each points.values() as value, i}
                <rect
                        x={xScale(i) + 2}
                        y={yScale(value)}
                        width={barWidth * 0.8}
                        height={yScale(0) - yScale(value)} />
            {/each}
        </g>
        <g class="axis y-axis">
            {#each yTicks as tick}
                <g class="tick tick-{tick}" transform="translate(0, {yScale(tick)})">
                    <line x2="100%" />
                    <text y="-4"
                    >{tick} {tick === 20 ? ' vote' : ''}</text>
                </g>
            {/each}
        </g>

        <g class="axis x-axis">
            {#each points.keys() as keys, i}
                <g class="tick" transform="translate({xScale(i)}, {height})">
                    <text x={barWidth / 2} y="-4">{keys}</text>
                </g>
            {/each}
        </g>
    </svg>
</div>

<h3>Average: {average}</h3>

<style>
    .x-axis .tick text {
        text-anchor: middle;
        color: white;
    }

    .bars rect {
        fill: #ffffff;
        stroke: none;
    }

    .tick {
        font-family: Poppins, sans-serif;
        font-size: 0.725em;
        font-weight: 200;
        color: white;
    }

    .tick text {
        fill: white;
        text-anchor: start;
        color: white;
    }

    .tick line {
        stroke: #ffffff;
        stroke-dasharray: 2;
        opacity: 1;
    }

    .tick.tick-0 line {
        display: inline-block;
        stroke-dasharray: 0;
    }
</style>