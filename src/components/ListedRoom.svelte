<script>
	import { createEventDispatcher } from "svelte";
	const dispatch = createEventDispatcher();

    export let room;
</script>

<div class="text-gray-400 mt-5 flex items-center justify-center gap-x-6 lg:justify-start">
	<div class="text-gray-400 group inline-flex">
		<button
			class="px-3.5 py-2.5 bg-transparent hover:bg-gray-400 dark:hover:bg-gray-700 text-sm font-semibold text-gray-900 dark:text-gray-400 rounded-l-md"
			on:click={() => dispatch("select")}
		>
			{room.roomName} - {room.unread}
		</button>
		<button 
            class="px-3.5 py-2.5 bg-transparent hover:bg-gray-400 dark:hover:bg-gray-700 text-sm font-semibold text-gray-900 dark:text-gray-400 rounded-r-md"
            on:click={() => dispatch("leave")}
		>
			✕
		</button>
	</div>
</div>
