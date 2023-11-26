<script>
    import { onMount } from "svelte";

	let theme;

	onMount(() => {
		theme = localStorage.getItem("theme") ?? "light";
		updateTheme();
	});

	function updateTheme() {
		if (theme == "light") {
			document.documentElement.classList.remove("dark");
		} else {
			document.documentElement.classList.add("dark");
		}
	}

	function toggle() {
		if (theme == "light") theme = "dark";
		else if (theme == "dark") theme = "light";
		localStorage.setItem("theme", theme);
		updateTheme();
	}
</script>

<div>
	{#if theme == "dark"}
		<img src="/sun.png" class="w-10 cursor-pointer" alt="Switch to light theme" on:click={toggle} on:keypress={toggle} />
	{:else}
		<img src="/moon.png" class="w-10 cursor-pointer" alt="Switch to dark theme" on:click={toggle} on:keypress={toggle} />
	{/if}
</div>
