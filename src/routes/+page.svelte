<script>
	import { marked } from "marked";
	import * as sdk from "matrix-js-sdk";
	import Olm from "olm";
	import { onMount } from "svelte";

	import ListedRoom from "../components/ListedRoom.svelte";
	import Message from "../components/Message.svelte";
	import Popup from "../components/Popup.svelte";
	import TextBox from "../components/TextBox.svelte";
	import ThemeSwitcher from "../components/ThemeSwitcher.svelte";

	export let data;
	let loading = true;

	let sounds = {}
	let peopleTyping = {};
	let messageView = {};

	let rooms = {};

	let currentRoomDetails = {
		id: undefined,
		name: undefined,
		messages: {},
		members: {}
	};

	let client;

	async function loadData() {
		await fetchRooms();
		loading = false;
	}

	async function editRoomName(roomId, newName) {
		const newNameEvent = {
			room_id: roomId,
			type: "m.room.name",
			content: { name: newName }
		};
		await client.sendStateEvent(roomId, "m.room.name", newNameEvent);
	}

	async function createRoom() {
		const createRoomResponse = await client.createRoom({ visibility: "private" });
		const roomId = createRoomResponse.room_id;
		return roomId;
	}

	async function leaveRoom(roomId) {
		await client.leave(roomId);
		delete rooms[roomId];
		rooms = rooms;
		currentRoomDetails = {
			id: undefined,
			name: undefined,
			messages: {},
			members: {}
		};
	}

	async function scrollToBottom(node, behavior) {
		node.scroll({ top: node.scrollHeight, behavior });
	};
	
	async function changeRoom(roomId) {
		const room = client.getRoom(roomId);
		if (!room) return;
		currentRoomDetails = {
			id: roomId,
			name: room.name,
			messages: [],
			members: {}
		};
		peopleTyping = {};		

		for (const message of (await client.roomInitialSync(roomId, 300)).messages.chunk) {
			if (message.type != "m.room.message") continue;

			currentRoomDetails.messages[message.event_id] = { 
				created_at: message.origin_server_ts,
				room: room,
				member: room.getMember(message.sender),
				content: message.content.body ? marked.parse(message.content.body) : ""
			};
		}

		for (const user of (await client.roomInitialSync(roomId, 300)).presence) {
			currentRoomDetails.members[user.content.user_id] = { displayName: user.content.user_id, presence: user.content.presence}
		}

		await scrollToBottom(messageView);
	}

	function fetchRooms() {
		for (const room of client.getRooms()) {
			rooms[room.roomId] = {
				roomCreator: room.myUserId,
				roomName: room.name,
				unread: room.notificationCounts.total
			};
		}
		rooms = rooms;
	}

	onMount(async () => {
		window.global ||= window;
		global.Olm = Olm;

		client = sdk.createClient({
			baseUrl: `https://${data.homeserver}`,
			accessToken: data.accessToken,
			userId: data.userId
		});
		await client.startClient();
		
		client.on("Room.timeline", (event, room) => {
			if (event.getType() != "m.room.message") return;
			if (room.roomId != currentRoomDetails.id) return;
			currentRoomDetails.messages[event.event.event_id] = { 
				created_at: event.event.origin_server_ts,
				room: room,
				member: room.getMember(event.getSender()),
				content: marked.parse(event.event.content.body)
			};
			try {
				if (event.getSender() != data.userId) sounds.message.play();
			} catch (e) {
				console.log(e);
			}
			
			scrollToBottom(messageView, "smooth");
		});

		client.on("RoomMember.typing", (_event, member) => {
			peopleTyping[member.name] = member.typing;
		});

		client.on("sync", (state) => {
			if (state != "PREPARED") return;
			loadData();
			fetchRooms();
		});

		client.on("m.presence", (_event, member) => {
			let tempMembers = {};
			for (const user of (client.roomInitialSync(roomId, 300)).presence) {
				tempMembers[user.content.user_id] = { displayName: user.content.user_id, presence: user.content.presence };
			}
			currentRoomDetails.members = tempMembers;
		});

		client.on("Room", fetchRooms);
	});

	function handleTypingUpdate(event) {
		if (event.detail.isTyping) client.sendTyping(currentRoomDetails.id, true);
		else client.sendTyping(currentRoomDetails.id, false);
	}
	
	function handleMessageUpdate(event) {		
		const content = {
			"body": event.detail.text,
			"msgtype": "m.text"
		};

		client.sendEvent(currentRoomDetails.id, "m.room.message", content, "");
	}

	let leaveRoomPopup = null;

	function pauseSounds() {
		for (let i of Object.keys(sounds)) {
			sounds.i.pause();
		}
	}
</script>

<svelte:head>
	<title> {currentRoomDetails.name ? (`${currentRoomDetails.name} -`) : ""} AquaChat </title>
</svelte:head>

<audio bind:this={sounds["joined"]} src="/assets/sounds/discordjoined.mp3" class="hidden" controls>
    <track kind="captions" />
</audio>
<audio bind:this={sounds["message"]} src="assets/sounds/discordmessage.mp3" class="hidden" controls>
    <track kind="captions" />
</audio>

{#if leaveRoomPopup}
	<Popup
		title="Leave room?"
		description={`Are you sure you want to leave ${rooms[leaveRoomPopup].roomName}?`}
		on:confirm={() => {
			leaveRoom(leaveRoomPopup);
			leaveRoomPopup = null;
		}}
		on:cancel={() => leaveRoomPopup = null}
	/>
{/if}

{#if loading}
	<div class="flex h-full justify-center">
		<img class="w-32 h-32 place-self-center animate-bounce" src="/fish.png" alt="Fish" />
	</div>
{:else}
	<div class="flex flex-row grow h-full">
		<!-- Room list -->
		<div class="p-4 w-1/4 max-h-full overflow-y-auto flex-grow-0 flex-shrink-0 bg-slate-200 dark:bg-slate-600">
			<h3 class="mb-4 font-semibold text-xl dark:text-gray-400 text-gray-700"> Your rooms </h3>
			<p class="text-sm dark:text-gray-400 text-gray-700">
				{#if Object.keys(rooms).length == 0}
					Loading...
				{:else}
					{#each Object.entries(rooms) as [ eventId, eventData ]}
						<ListedRoom
							room={eventData}
							on:select={() => changeRoom(eventId)}
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
		<div class="flex flex-col grow pl-4 pt-4 dark:text-white max-h-full overflow-y-auto flex-grow">
			{#if !currentRoomDetails.name}
				Please select a room!
			{:else}
				<h1 class="text-2xl"> Welcome to {currentRoomDetails.name}! </h1>
				<div bind:this={messageView} class="flex flex-col mt-2 grow w-full overflow-y-auto">
					{#each Object.values(currentRoomDetails.messages) as eventData}
						<Message message={eventData} />
					{/each}
				</div>
				<TextBox on:typing={handleTypingUpdate} on:updated={handleMessageUpdate} peopleTyping={peopleTyping} channel={currentRoomDetails.name} />
			{/if}
		</div>

		<!-- User list -->
		<div class="flex-shrink p-4 w-1/4 max-h-full overflow-y-auto flex-grow-0 flex-shrink-0 bg-slate-200 dark:bg-slate-600 space-y-4">
			<!-- Online members -->	
			<div class:hidden={Object.keys(currentRoomDetails.members).length <= 0}>
				<h3 class="mb-2 font-semibold text-xl dark:text-gray-400 text-gray-700"> Online - {Object.values(currentRoomDetails.members).filter(member => member.presence === "online").length} </h3>
				<p class="text-sm dark:text-gray-400 text-gray-700">
					{#each Object.entries(currentRoomDetails.members) as [userId, member]}
						<p class="font-bold">
							{#if member.presence === "online"}
								{member.displayName} - Online
							{/if}
						</p>
					{/each}
				</p>
			</div>
			
			<!-- Offline members-->
			<div class:hidden={Object.keys(currentRoomDetails.members).length <= 0}>
				<h3 class="mb-2 font-semibold text-xl dark:text-gray-400 text-gray-700"> Offline - {Object.values(currentRoomDetails.members).filter(member => member.presence === "offline").length} </h3>
				<p class="text-sm dark:text-gray-400 text-gray-700">
					{#each Object.entries(currentRoomDetails.members) as [userId, member]}
						<p class="font-bold">
							{#if member.presence === "offline"}
								{member.displayName} - Offline
							{/if}
						</p>
					{/each}
				</p>
			</div>
		</div>
	</div>
{/if}
