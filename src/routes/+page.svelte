<script lang="ts">
	import { parse as marked } from "marked";
	import * as matrix from "matrix-js-sdk";
	import { onMount } from "svelte";

	import ListedMember from "../components/ListedMember.svelte";
	import ListedRoom from "../components/ListedRoom.svelte";
	import Message from "../components/Message.svelte";
	import Popup from "../components/Popup.svelte";
	import TextBox from "../components/TextBox.svelte";
	import ThemeSwitcher from "../components/ThemeSwitcher.svelte";

	import { deleteMessage, sendMessage } from "$lib/messages";
	import { changeRoom, fetchRooms, type RoomDetails } from "$lib/rooms";
	import { scrollToBottom } from "$lib/utils";

	import type { Room } from "$lib/rooms";
	import type { MatrixClient } from "matrix-js-sdk";

	export let data;

	let client: MatrixClient;
	let rooms: { [id: string]: Room } = {};

	let currentRoomDetails: RoomDetails = {
		id: undefined,
		name: undefined,
		messages: {},
		members: {}
	};

	let loading = true;
	let messageView;
	let sounds: any = {};
	let leaveRoomPopup = null;
	let deleteMessagePopup = null;

	onMount(async () => {
		// @ts-expect-error
		window.global ||= window;

		client = matrix.createClient({
			baseUrl: `https://${data.homeserver}`,
			accessToken: data.accessToken,
			userId: data.userId
		});
		await client.startClient();

		client.on(matrix.RoomEvent.Timeline, (event, room) => {
			if (event.getType() != "m.room.message") return;
			if (room.roomId != currentRoomDetails.id) return;

			currentRoomDetails.messages[event.event.event_id] = {
				created_at: event.event.origin_server_ts,
				room: room,
				member: room.getMember(event.getSender()),
				content: event.event.content.body ? marked(event.event.content.body) : "<i> This message was deleted </i>"
			};

			try {
				if (event.getSender() != data.userId) sounds.message.play();
			} catch {}

			scrollToBottom(messageView);
		});

		client.on(matrix.RoomMemberEvent.Typing, (_event, member) => {
			if (member.userId != data.userId) {
				if (member.typing) {
					rooms[member.roomId].peopleTyping[member.userId] = member.rawDisplayName;
				} else {
					console.log(member.userId, "has stopped typing", rooms[member.roomId].peopleTyping);
					delete rooms[member.roomId].peopleTyping[member.userId];
					rooms[member.roomId].peopleTyping = rooms[member.roomId].peopleTyping;
				}
			}
		});

		client.on(matrix.ClientEvent.Sync, async (state) => {
			if (state != "PREPARED") return;
			rooms = await fetchRooms(client);
			loading = false;
		});

		client.on(matrix.UserEvent.Presence, async (event, user) => {
			if (event.getRoomId() == undefined || currentRoomDetails.id == undefined) return;
			if (event.getRoomId() != currentRoomDetails.id) return;
			currentRoomDetails.members[user.userId] = {
				userId: user.userId,
				displayName: user.rawDisplayName ?? "?",
				avatar: client.mxcUrlToHttp(user.avatarUrl),
				presence: user.presence
			};
		});

		client.on(matrix.ClientEvent.Room, async () => rooms = await fetchRooms(client));
	});

	function pauseSounds() {
		for (let i of Object.keys(sounds)) {
			sounds[i].pause();
		}
	}
</script>

<svelte:head>
	<title> {currentRoomDetails.name ? `${currentRoomDetails.name} -` : ""} AquaChat </title>
</svelte:head>

<audio bind:this={sounds["joined"]} src="/assets/sounds/discordjoined.mp3" class="hidden">
    <track kind="captions" />
</audio>
<audio bind:this={sounds["message"]} src="assets/sounds/discordmessage.mp3" class="hidden">
    <track kind="captions" />
</audio>

{#if leaveRoomPopup}
	<Popup
		title="Leave room?"
		description={`Are you sure you want to leave ${rooms[leaveRoomPopup].name}?`}
		on:confirm={() => {
			client.leave(leaveRoomPopup);

			delete rooms[leaveRoomPopup];
			currentRoomDetails = {
				id: undefined,
				name: undefined,
				messages: {},
				members: {}
			};

			leaveRoomPopup = null;
		}}
		on:cancel={() => leaveRoomPopup = null}
	/>
{/if}

{#if loading}
	<div class="flex h-full justify-center">
		<img class="w-32 h-32 place-self-center animate-bounce" src="/assets/images/fish.png" alt="Fish" />
	</div>
{:else}
	<div class="flex flex-row grow h-full">
		<!-- Room list -->
		<div class="p-4 w-1/4 max-h-full overflow-y-auto bg-slate-200 dark:bg-slate-600">
			<h3 class="mb-4 font-semibold text-xl dark:text-gray-400 text-gray-700"> Your rooms </h3>
			<p class="text-sm dark:text-gray-400 text-gray-700">
				{#if Object.keys(rooms).length == 0}
					Loading...
				{:else}
					{#each Object.entries(rooms) as [ eventId, eventData ]}
						<ListedRoom
							room={eventData}
							on:select={async () => {
								currentRoomDetails = await changeRoom(client, eventId);
								scrollToBottom(messageView);
							}}
							on:leave={() => leaveRoomPopup = eventId}
						/>
					{/each}
				{/if}
			</p>
		</div>

		<!-- Theme switcher -->
		<div class="absolute left-5 bottom-5">
			<ThemeSwitcher />
		</div>

		<!-- Messages -->
		<div class="flex flex-col grow pl-4 pt-4 dark:text-white">
			{#if !currentRoomDetails.name}
				<p class="mb-4 font-semibold text-xl dark:text-gray-400 text-gray-700"> Please select a room! </p>
			{:else}
				<h1 class="mb-4 font-semibold text-xl dark:text-gray-400 text-gray-700"> {currentRoomDetails.name} </h1>
				<div bind:this={messageView} class="flex flex-col mt-2 grow w-full h-64 overflow-y-scroll">
					{#each Object.entries(currentRoomDetails.messages) as [ eventId, eventData ]}
						<Message
							client={client}
							message={eventData}
							deletable={eventData.member.userId == data.userId}
							on:delete={() => deleteMessagePopup = eventId}
						/>
					{/each}

					<!-- Message deletion confirmation popup -->
					{#if deleteMessagePopup}
						<Popup
							title="Delete message?"
							description={`Are you sure you want to delete the message?`}
							on:confirm={() => {
								deleteMessage(client, currentRoomDetails.id, deleteMessagePopup);
								currentRoomDetails.messages[deleteMessagePopup].content = "<i> This message was deleted </i>";
								deleteMessagePopup = null;
							}}
							on:cancel={() => deleteMessagePopup = null}
						/>
					{/if}
				</div>

				<!-- Input box -->
				<TextBox
					on:typing={({ detail }) => client.sendTyping(currentRoomDetails.id, detail, 1e3)}
					on:updated={async ({ detail }) => {
						await sendMessage(client, currentRoomDetails.id, detail);
						scrollToBottom(messageView);
					}}
					peopleTyping={rooms[currentRoomDetails.id].peopleTyping}
					channel={currentRoomDetails.name}
				/>
			{/if}
		</div>

		<!-- User list -->
		<div
			class="p-4 w-1/4 max-h-full overflow-y-auto bg-slate-200 dark:bg-slate-600 space-y-4"
			class:hidden={Object.keys(currentRoomDetails.members).length <= 0}
		>
			<!-- Online members -->
			<h3 class="mb-2 font-semibold text-xl dark:text-gray-400 text-gray-700">
				Online - {Object.values(currentRoomDetails.members).filter((member) => member.presence === "online").length}
			</h3>
			<div class="text-sm dark:text-gray-400 text-gray-700 space-y-2">
				{#each Object.values(currentRoomDetails.members) as member}
					{#if member.presence == "online"}
						<div class="flex flex-row items-center space-x-2">
							<ListedMember {member} />
						</div>
					{/if}
				{/each}
			</div>

			<!-- Offline members -->
			<h3 class="font-semibold text-xl dark:text-gray-400 text-gray-700">
				Offline - {Object.values(currentRoomDetails.members).filter((member) => member.presence === "offline").length}
			</h3>
			<div class="text-sm dark:text-gray-400 text-gray-700 space-y-2">
				{#each Object.values(currentRoomDetails.members) as member}
					{#if member.presence == "offline"}
						<div class="flex flex-row items-center space-x-2 opacity-50">
							<ListedMember {member} />
						</div>
					{/if}
				{/each}
			</div>
		</div>
	</div>
{/if}
