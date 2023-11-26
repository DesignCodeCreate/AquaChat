<script>
	import { onMount } from "svelte";
	import Olm from "olm";
	import { DarkMode } from "flowbite-svelte";

	let homeserver = "matrixapp.chat";
	let errorMessage = "";
	let username = "";
	let password = "";
	let url = "";

	onMount(() => {
		window.global ||= window;
		global.Olm = Olm;
	});
</script>

<div class="flex h-screen justify-center items-center">
	<div class="flex flex-col p-6 bg-slate-700 rounded-lg">
		<span><h1 class="mb-4 text-2xl font-bold text-white"> Welcome back! </h1> <DarkMode/></span>
		<form class="flex flex-col" method="POST" action="?/sso">
			<input type="text" name="homeserver" bind:value={homeserver} class="hidden" readonly />
			<button type="submit" class="mb-4 p-2 bg-blue-500 hover:bg-blue-600 text-slate-100 rounded-md"> Login with Matrix </button>
		</form>
		
		<form class="flex flex-col" method="POST" action="?/login">
			<label class="mb-2 font-bold text-blue-300" for="homeserver"> Homeserver </label>
			<input class="mb-4 p-2 bg-slate-500 text-slate-200 rounded-md" type="text" name="homeserver" bind:value={homeserver} required />

			<label class="mb-2 font-bold text-blue-300" for="username"> Username: </label>
			<input class="mb-4 p-2 bg-slate-500 text-slate-200 rounded-md" type="text" name="username" bind:value={username} required />

			<label class="mb-2 font-bold text-blue-300" for="password"> Password: </label>
			<input
				class="mb-4 p-2 bg-slate-500 text-slate-200 outline-0 rounded-md"
				type="password"
				name="password"
				bind:value={password}
				required
			/>
			
			{#if errorMessage}
				<p class="text-red"> {errorMessage} </p>
			{/if}

			<button class="p-2 bg-blue-500 hover:bg-blue-600 text-slate-100 rounded-md" type="submit"> Login </button>		
		</form>
	</div>
</div>
