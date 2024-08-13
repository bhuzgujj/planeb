<script>
    import {onMount} from "svelte";
    import ls from "../constant.js";

    let name = ""

    /**
     * @param {any} evt
     */
    function nameChange(evt) {
        if (evt.key === "Enter") {
            let userId = localStorage.getItem(ls.itemKeys.id)
            if (userId) {
                fetch(`/users/${userId}`, {
                    method: "PUT",
                    body: JSON.stringify({
                        name: name
                    })
                })
                    .then(() => {
                        localStorage.setItem(ls.itemKeys.name, name)
                    })
            } else {
                console.error("No userid found in localStorage, key looked is:" + "planeb.id")
            }
        }
    }

    onMount(()=>{
        name = localStorage.getItem(ls.itemKeys.name) ?? ""
    })
</script>


<nav>
    <div style="height: 100%; flex-grow: 1">
        <a href="/">Home</a>
        <a href="/rooms">Rooms</a>
        <a href="/cards">Card sets</a>
    </div>
    <label>
        Name: <input type="text" style="padding: 0; margin: 0;" on:keypress={(e) => nameChange(e)} bind:value={name}/>
    </label>
</nav>

<div class="fcenter">
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