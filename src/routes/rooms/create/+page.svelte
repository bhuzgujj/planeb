<script>
    import {enhance} from '$app/forms';
    import {goto} from "$app/navigation";
    import constants from "../../../constant.js";
    import BatchTaskCreationForm from "../../../components/BatchTaskCreationForm.svelte";
    import InputGroup from "../../../components/InputGroup.svelte";
    import ToggleInput from "../../../components/ToggleInput.svelte";
    import CardSet from "../../../components/CardSet.svelte";

    /** @type {import('./$types').ActionData} */
    export let form;
    /** @type {import('./$types').PageData} */
    export let data;

    const sets = data.sets
    /** @type {string} */
    let regex = ""
    /** @type {import("$lib/data.js").Task[]} */
    let previews = []
    /** @type {string} */
    let selectedSet = ""
</script>
<h1>Create a room</h1>
<br>
<form
        autocomplete="off"
        method="post"
        use:enhance={(res) => {
                return async ({ result }) => {
                    if (result.type === 'success' && result?.data?.location) {
                        const moderatorId = localStorage.getItem(constants.localStorageKeys.id)
                        const moderatorName = localStorage.getItem(constants.localStorageKeys.name)
                        await fetch("/rooms", {
                            method: "POST",
                            body: JSON.stringify({
                                name: result?.data?.name,
                                persisted: result?.data?.persisted,
                                moderator: {
                                    id: moderatorId,
                                    name: moderatorName
                                },
                                cards: result?.data?.cards,
                                taskPrefix: result?.data?.taskPrefix,
                                tasks: previews
                            })
                        })
                        await goto(result?.data?.location.toString());
                    }
                };
            }
        }
        style="width: 100%; display: flex; justify-content: space-between"
>
    <div style="width:45%;">
        <h2>Room info</h2>
        <InputGroup
            name="Room name"
            type="text"
            inputName="name"
            value={form?.name ?? ""}
            error={form?.nameError}
        />
        <InputGroup
            name="Task number prefix (regex)"
            type="text"
            inputName="task_prefix"
            value={form?.name ?? ""}
            error={undefined}
        />
        <ToggleInput
                name="Persist room"
                inputName="persisted"
        />
        <br>
        <div style="height: 400px">
            <CardSet cards={sets.get(selectedSet ?? "")?.cards ?? []} >
                <select name="sets" bind:value={selectedSet}>
                    <option value="" disabled selected style="color: #444">Select a card set</option>
                    {#each sets.keys() as id}
                        <option value={id}>{sets.get(id)?.name}</option>
                    {/each}
                </select>
            </CardSet>
        </div>
        <br>
        <button type="submit">Create</button>
    </div>
    <div style="width: 50%">
        <h2>Tasks</h2>
        <br>
        <BatchTaskCreationForm
            bind:previews={previews}
            bind:regex={regex}
        />
    </div>
</form>

<style>
    select {
        width: 100%;
        padding-left: 5px;
    }
</style>