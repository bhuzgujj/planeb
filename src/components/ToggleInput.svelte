<script>
    /** @type string */
    export let name;
    /** @type string */
    export let inputName;
</script>

<div>
    <label for={inputName}>
        <input name={inputName} type="checkbox" />
        <span class="slider">
            <span class="text">{name}</span>
            <span class="sphere"></span>
        </span>
    </label>
</div>

<style>
    div {
        height: 30px;
        display: flex;
        margin: 0;
        padding: 0;
        align-items: center;
    }

    input {
        position: absolute;
        width: 100%;
        height: 100%;
        z-index: 1;
        opacity: 0;
        cursor: pointer;
    }

    label {
        position: relative;
        display: inline-block;
        height: 30px;
        width: 200px;
    }

    input:checked + .slider {
        background: #ccc;
    }

    input:checked + * {
        transition: 0.4s;
    }

    input + * {
        transition: 0.4s;
    }

    input:checked + .slider > .text {
        color: #000;
    }

    input:checked + .slider .sphere {
        left: 85%;
    }

    .sphere {
        background-color: #fff;
        height: 28px;
        width: 28px;
        border-radius: 50%;
        position: absolute;
        left: -1px;
        transition: 0.4s;
    }

    .text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: transparent;
        font-weight: 300;
        -webkit-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }

    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #333;
        border-radius: 30px;
    }
</style>