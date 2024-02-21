<script>
	import { createEventDispatcher } from "svelte";
	const dispatch = createEventDispatcher();

	export let peopleTyping;
	export let channel;

	let value = "";

	function submit() {
		if (value == "") return;
		dispatch("updated", value);
		value = "";
		typing(false);
	}

	function typing(typing) {
		dispatch("typing", typing);
	}
</script>

<div class="mt-4 mb-1">
	{#each Object.values(peopleTyping) as name}
		<p class="font-bold"> {name} is typing </p>
	{/each}
</div>

<div class="flex mb-4 w-full">
	<textarea
		bind:value
		placeholder = {`Message ${channel}`}
		class="resize-none grow h-10 rounded-l-md text-box outline-0 border-l border-y border-slate-400 overflow-y-auto"
		on:keypress={(event) => {
			typing(value != "");
			if (event.keyCode == 13 && !event.shiftKey) {
				event.preventDefault();
				submit();
			}
		}}
	/>
	<button
		on:click={submit}
		class="mr-8 px-4 rounded-r-md text-slate-300 bg-blue-800 border-r border-y border-slate-400"
	>
		Send
	</button>
</div>
