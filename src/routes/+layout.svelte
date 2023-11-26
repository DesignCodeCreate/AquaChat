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
	<slot />
</div>
