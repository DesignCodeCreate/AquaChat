<script>
	import { createEventDispatcher,  onMount} from "svelte";
	
	const dispatch = createEventDispatcher();
	export let client;
	export let message;
	export let deletable;

	let pfpSrc = null;

	onMount(async () => {
		let avatarUrl = client.getUser(message.member.userId).avatarUrl;
		if (avatarUrl) pfpSrc = client.mxcUrlToHttp(avatarUrl);
	});
	
	function formatTime(timestamp) {
		let date = new Date(parseInt(timestamp));
		return `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} - ${date.toTimeString().slice(0, -34)}`;
	}

	function deleteMessage() {
		dispatch("deleted", { message: message });
	}
</script>

<div class="flex items-center p-2 mr-4 relative group hover:bg-slate-400 rounded-sm">
	<div class="flex-1">
		<div class="flex-1">
			<div class="flex flex-row items-center mb-2 space-x-4">
				{#if pfpSrc}
					<div
						class="w-10 h-10 bg-cover bg-center rounded-full"
						style={`background-image: url('${pfpSrc}');`}
						alt="Profile picture"
					/>
				{:else}
					<div
						class="flex w-10 h-10 justify-center items-center font-bold text-white rounded-full"
						alt="Profile picture"
						style="background-color:{message.avatar_colour}"
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
			on:keypress={deleteMessage}
			class="self-end place-self-end w-6 h-6 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
			src="/assets/images/trashcan.png"
			alt="Delete message"
		/>

	{/if}
	
</div>
