<script lang="ts">
	import { createEventDispatcher } from "svelte";

	import { randomColour } from "$lib/utils";

	import type { Message } from "$lib/rooms";
	import type { MatrixClient } from "matrix-js-sdk";

	const dispatch = createEventDispatcher();
	export let client: MatrixClient;
	export let message: Message;
	export let deletable;

	let profilePictureUrl = null;

	$: {
		const user = message.member.user ?? client.getUser(message.member.userId);
		profilePictureUrl = client.mxcUrlToHttp(user.avatarUrl ?? "");
	}

	function formatTime(timestamp) {
		const date = new Date(parseInt(timestamp));
		return `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} - ${date.toTimeString().slice(0, -34)}`;
	}

	function deleteMessage() {
		dispatch("delete", { message });
	}
</script>

<div class="flex items-center p-2 mr-4 relative group hover:bg-slate-400 rounded-sm">
	<div class="flex-1">
		<div class="flex-1">
			<div class="flex flex-row items-center mb-2 space-x-4">
				{#if profilePictureUrl}
					<div
						class="w-10 h-10 bg-cover bg-center rounded-full"
						style={`background-image: url('${profilePictureUrl}');`}
					/>
				{:else}
					<div
						class="flex w-10 h-10 justify-center items-center font-bold text-white rounded-full"
						style="background-color: {randomColour(message.member.name)};"
					>
						{message.member.name[0].toUpperCase()}
					</div>
				{/if}
				<b> {message.member.name} - {formatTime(message.created_at)} </b>
			</div>
		</div>

		<div class="ml-14">
			{@html message.content}
		</div>
	</div>

	{#if deletable}
		<img
			on:click={deleteMessage}
			on:keydown={deleteMessage}
			class="self-end place-self-end w-6 h-6 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
			src="/assets/images/trashcan.png"
			alt="Delete message"
		/>
	{/if}
</div>
