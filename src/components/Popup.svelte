<script>
	import { createEventDispatcher } from "svelte";
	const dispatch = createEventDispatcher();

	export let title;
	export let description;
</script>

<div class="p-4 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 bg-slate-200 rounded-md z-[100]">
	<h3 class="font-bold text-black text-2xl"> {title} </h3>
	<p class="text-xl text-black"> {description} </p>

	<div class="flex flex-row mt-3">
		<button
			class="p-2 mr-2 w-1/2 bg-red-500 text-white rounded-md"
			on:click={() => dispatch("confirm")}
		>
			Confirm
		</button>
		<button
			class="p-2 w-1/2 bg-blue-500 text-white rounded-md"
			on:click={() => dispatch("cancel")}
		>
			Cancel
		</button>
	</div>
</div>
