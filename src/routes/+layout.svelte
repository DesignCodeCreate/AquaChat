<script>
	import "../app.postcss";
	import { DarkMode } from "flowbite-svelte";

	import { onMount } from "svelte";
	onMount(() => {
		eruda.init();
	});
</script>

<svelte:head>
	<script src="https://cdn.jsdelivr.net/npm/eruda" />
</svelte:head>

<div class="flex flex-col">
	<div class="flex flex-row items-center w-full p-1 justify-between bg-slate-700 text-white">
		<h1 class="text-xl"> Fishcord </h1>
		<DarkMode class="justify-self-right" />
	</div>
	<slot />
</div>
