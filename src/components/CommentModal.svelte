<script>
    /** @type boolean */
    export let show;
    /** @type {() => void} */
    export let onClose;
    /** @type {() => void} */
    export let onSave;
    /** @type HTMLDialogElement */
    let dialog
    $: if (dialog && show) dialog.showModal();
    function close() {
        onClose()
        dialog.close()
    }
    function save() {
        onSave()
        dialog.close()
    }
</script>

<dialog
    class=""
    bind:this={dialog}
    on:close={() => {show = false}}
>
    <div>
        <slot name="header" />
        <hr />
        <slot />
        <hr />
        <button on:click={() => close()}>Cancel</button>
        <button on:click={() => save()}>Save</button>
    </div>
</dialog>

<style>
    dialog {
        width: 32em;
        border-radius: 0.2em;
        border: none;
        padding: 0!important;
        text-align: center;
        position: absolute;
        transform: translateX(-50%) translateY(-50%);
        top: 50%;
        left: 50%;
    }
    dialog::backdrop {
        background: rgba(0, 0, 0, 0.3);
    }
    dialog > div {
        padding: 1em;
    }
    dialog[open] {
        animation: zoom cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes zoom {
        from {
            transform: scale(0.95);
        }
        to {
            transform: scale(1);
        }
    }
    dialog[open]::backdrop {
        animation: fade ease-out;
    }
    @keyframes fade {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
</style>