<script>
	import { createEventDispatcher } from "svelte";
	import { onMount } from "svelte";

	let value;
	export let channel;
	
	const dispatch = createEventDispatcher();
	function submit(event) {
		if (value == "") return;
		dispatch("updated", { text: value });
		value = "";
	}
</script>

<div class="button-container">
	<form on:submit={submit}>
		<div class="flex">
			<textarea bind:value class="grow h-10 rounded-l-md text-slate-300 bg-slate-500 outline-0 border-l border-y border-slate-400" on:keypress={(event) => {
				if (event.which == 13 && !event.shiftKey) submit();
			}} />
				
			<button on:click={submit} class="px-4 rounded-r-md text-slate-300 bg-blue-800 border-r border-y border-slate-400"> Send </button>
		</div>
	</form>
</div>

<style>
	.button-container {
		bottom: 0;
		position: fixed;
		left: 0;
		right: 0;
		text-align: center;
		padding: 10px;
	}
</style>