<script>
    import {onMount} from "svelte";
    import constants from "../constant.js";

    let name = ""

    /**
     * @param {any} evt
     */
    function nameChange(evt) {
        if (evt.key === "Enter") {
            let userId = localStorage.getItem(constants.localStorageKeys.id)
            if (userId) {
                fetch(`/users/${userId}`, {
                    method: "PUT",
                    body: JSON.stringify({
                        name: name
                    })
                })
                    .then(() => {
                        localStorage.setItem(constants.localStorageKeys.name, name)
                    })
            } else {
                console.error("No userid found in localStorage, key looked is:" + "planeb.id")
            }
        }
    }

    onMount(() => {
        name = localStorage.getItem(constants.localStorageKeys.name) ?? ""
    })
</script>


<nav>
    <div style="height: 100%; flex-grow: 1">
        <a href="/">Home</a>
        <a href="/rooms">Rooms</a>
        <a href="/cards">Card sets</a>
    </div>
    <label>
        Name: <input type="text" on:keypress={(e) => nameChange(e)} bind:value={name}/>
    </label>
</nav>

<div class="fcenter" style="margin-bottom: 1rem; margin-top: 1rem;">
    <div class="fcol">
        <slot/>
    </div>
</div>

<style>
    a:hover {
        transition: 100ms;
        background: #555555;
    }

    a {
        vertical-align: center;
        padding: 2px 2rem;
        border: solid 1px #555555;
        margin: 5px;
        border-radius: 5px;
        text-decoration: none;
    }
</style>