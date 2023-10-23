<script>
	import "../app.postcss";

	import { DarkMode } from "flowbite-svelte";
</script>

<div class="flex flex-col">
	<div class="flex flex-row items-center w-full p-1 justify-between bg-slate-700 text-white">
		<h1 class="text-xl"> Fishcord </h1>
		<DarkMode class="justify-self-right" />
	</div>
	<slot />
</div>
