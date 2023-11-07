<script>
	import { onMount } from "svelte";
	import Olm from "olm";


	let errorMessage = "";
	let username = "";
	let password = "";
	let url = "";

	onMount(() => {
		window.global ||= window;
		global.Olm = Olm;
		url = window.location.href;
		url = url.slice(8);
		url = url.slice(0, url.lastIndexOf("/"));
	});
	

	
</script>

<div class="flex h-screen justify-center items-center">
	<div class="p-6 bg-slate-700 rounded-lg">
		<h1 class="mb-4 text-2xl font-bold text-white"> Welcome back! </h1>
		<form class="flex flex-col" method="POST">
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
				<p class="text-red">{errorMessage}</p>
			{/if}

			<button class="p-2 bg-blue-500 hover:bg-blue-600 text-slate-100 rounded-md" type="submit"> Login </button>
			<br>
		</form>
		<a href="https://matrix.org/_matrix/client/r0/login/sso/redirect?redirectUrl=https://{url}/matrix_auth_callback">
			<button class="p-2 bg-blue-500 hover:bg-blue-600 text-slate-100 rounded-md"> Login With Matrix </button>
		</a>
	</div>
</div>
