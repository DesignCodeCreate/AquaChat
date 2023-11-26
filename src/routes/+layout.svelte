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

<div class="flex flex-col h-screen">
	<div class="flex flex-row items-center w-full p-1 justify-between dark:bg-slate-700 dark:text-white bg-slate-400 text-slate-900">
		<h1 class="font-semibold text-xl"> AquaChat </h1>
		<DarkMode class="justify-self-right" />
	</div>
	<slot />
</div>
