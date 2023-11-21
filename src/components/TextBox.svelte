<script>
	import { createEventDispatcher } from "svelte";
	const dispatch = createEventDispatcher();

	export let peopleTyping;
	export let channel;

	let value = "";
  
	function submit() {
		if (value == "") return;
		dispatch("updated", { text: value });
		typing(false);
		value = "";
	}

	function typing(typing) {
		dispatch("typing", { isTyping: typing });
	}

	function checkIfNone() {
		if (value == "") typing(false);
		else typing(true);
	}
</script>

{#each Object.entries(peopleTyping) as [ name, typing  ]}
{#if typing}
	<b><p>{name} is typing</p></b>
{/if}
{/each}

<div class="flex mb-6 w-full">
	<textarea
		bind:value
		placeholder = {`Message #${channel}`}
		class="grow h-10 rounded-l-md text-slate-300 bg-slate-500 outline-0 border-l border-y border-slate-400"
		on:keypress={(event) => {
			if (event.keyCode == 13 && !event.shiftKey) submit();
			checkIfNone();
		}}
		on:keydown={(event) => {
			const key = event.key;
			if (key == "Backspace" || key == "Delete") checkIfNone();
		}}
	/>
	<button
		on:click={submit}
		class="mr-8 px-4 rounded-r-md text-slate-300 bg-blue-800 border-r border-y border-slate-400"
	>
		Send
	</button>
</div>
