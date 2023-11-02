<script>
	import { createEventDispatcher, onMount } from "svelte";
	const dispatch = createEventDispatcher();

	export let typingText;

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



{#if typingText}
  <div class="typing-indicator">
    <div class="dot one"></div>
    <div class="dot two"></div>
    <div class="dot three"></div>

	<p> &nbsp;&nbsp;<b>{typingText}</b></p>
  </div>
{/if}

<div class="button-container">
	<form on:submit={submit}>
		
		<div class="flex">
			<textarea
				id="textbox"
				bind:value={value}
				class="grow h-10 rounded-l-md text-slate-300 bg-slate-500 outline-0 border-l border-y border-slate-400"
				on:keypress={(event) => {
					if (event.which == 13 && !event.shiftKey) submit();
					checkIfNone();
					
				}}
				></textarea>
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
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		text-align: center;
		padding: 10px;
	}

	.typing-indicator {
		position: absolute;
		bottom: 50px;
		left: 10px;
		display: flex;
		align-items: center;
		background-color: #36393f;
		color: #ffffff;
		padding: 5px 10px;
		border-radius: 10px;
		font-size: 12px;
		font-weight: bold;
	}
	
	.dot {
		width: 8px;
		height: 8px;
		background-color: #ffffff;
		border-radius: 50%;
		margin: 0 2px;
		animation: typingAnimation 1s infinite;
	}

	.dot.one {
		animation-delay: 0.1s;
	}

	.dot.two {
		animation-delay: 0.2s;
	}

	.dot.three {
		animation-delay: 0.4s;
	}

	@keyframes typingAnimation {
		0%, 20%, 80%, 100% {
			transform: scale(1);
		}
		40% {
			transform: scale(0);
		}
	}
</style>
