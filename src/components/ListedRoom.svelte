<script lang="ts">
	import { createEventDispatcher } from "svelte";
	const dispatch = createEventDispatcher();

	import { randomColour } from "$lib/utils";

	import type { Room } from "$lib/rooms";

    export let room: Room;
</script>

<div class="text-gray-400 mt-5 flex items-center justify-center gap-x-6 lg:justify-start">
	<div class="text-gray-400 group inline-flex">
		{#if room.avatar}
			<div
				class="w-10 h-10 bg-cover bg-center rounded-full"
				style={`background-image: url('${room.avatar}');`}
				on:click={() => dispatch("select")}
				on:keydown={() => dispatch("select")}
			/>
		{:else}
			<div class="inline-block mb-[-15px]">
				<div
					class="flex w-10 h-10 justify-center items-center font-bold text-white rounded-full"
					style="background-color: {randomColour(room.name)};"
					on:click={() => dispatch("select")}
					on:keydown={() => dispatch("select")}
				>
					{room.name.toUpperCase()[0]}
				</div>
			</div>
		{/if}

		<button
			class="px-3.5 py-2.5 bg-transparent hover:bg-gray-400 dark:hover:bg-gray-700 text-sm font-semibold text-gray-900 dark:text-gray-400 rounded-l-md"
			on:click={() => dispatch("select")}
		>
			{#if room.unread != undefined}
				{room.name} - {room.unread}
			{:else}
				{room.name}
			{/if}
		</button>

		<button
            class="px-3.5 py-2.5 bg-transparent hover:bg-gray-400 dark:hover:bg-gray-700 text-sm font-semibold text-gray-900 dark:text-gray-400 rounded-r-md"
            on:click={() => dispatch("leave")}
		>
			✕
		</button>
	</div>
</div>
