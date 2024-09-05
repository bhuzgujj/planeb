<script>
    /** @type string */
    export let name;
    /** @type string */
    export let type;
    /** @type string */
    export let inputName;
    /** @type any */
    export let value;
    /** @type {string | undefined} */
    export let error;
</script>

<div class="form_group">
    {#if error}
        <input name={inputName} type={type} value={value} placeholder="input" autocomplete="off" style="border-bottom: 2px solid #900"/>
        <label for={inputName} style="color: #900">{error}</label>
    {:else}
        <input name={inputName} type={type} value={value} placeholder="input" autocomplete="off"/>
        <label for={inputName}>{name}</label>
    {/if}
</div>