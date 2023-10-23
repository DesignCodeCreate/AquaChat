<script>
	import { onMount } from "svelte";

	onMount(() => {
		let w = window.open("https://matrix.org/_matrix/static/client/login/", "_blank");
		w.onload = () => {
			console.log(w);
			w.onLogin = () => {
				console.log(arguments);
			};
		};
	});
</script>