<script>
	import { createEventDispatcher, onMount } from "svelte";
	const dispatch = createEventDispatcher();

	let value = "";
  
	function submit(event) {
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
	
	onMount(() => {
		document.getElementById("textbox").addEventListener('keydown', function(event) {
			const key = event.key;
			if (key === "Backspace" || key === "Delete") {
				checkIfNone();
			}
		});
	});
</script>
  
<div class="button-container">
	<form on:submit={submit}>
		<div class="flex">
			<textarea
				id="textbox"
				bind:value
				class="grow h-10 rounded-l-md text-slate-300 bg-slate-500 outline-0 border-l border-y border-slate-400"
				on:keypress={(event) => {
					if (event.which == 13 && !event.shiftKey) submit();
					checkIfNone();
				}}
			/>

			<button
				on:click={submit}
				class="px-4 rounded-r-md text-slate-300 bg-blue-800 border-r border-y border-slate-400"
			>
				Send
			</button>
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
