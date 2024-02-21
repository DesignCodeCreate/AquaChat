<script lang="ts">
	import { randomColour } from "$lib/utils";

	import type { Member } from "$lib/rooms";

	export let member: Member;
</script>

<div class="flex flex-row items-center space-x-2" class:opacity-50={member.presence == "offline"}>
	{#if member.avatar}
		<div
			class="w-10 h-10 bg-cover bg-center rounded-full"
			style={`background-image: url('${member.avatar}');`}
		/>
	{:else}
		<div
			class="flex w-10 h-10 justify-center items-center font-bold text-white rounded-full"
			style="background-color: {randomColour(member.displayName)};"
		>
			{member.displayName[0].toUpperCase()}
		</div>
	{/if}
	<p class="inline-block font-bold"> {member.displayName} </p>
</div>
