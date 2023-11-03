<script>
	import { marked } from "marked";
	import * as sdk from "matrix-js-sdk";
	import Olm from "olm";
	import { onMount } from "svelte";

	import TextBox from "../components/TextBox.svelte";

	export let data;

	let personTyping;

	function formatTime(timestamp) {
		let date = new Date(parseInt(timestamp));
		return `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} - ${date.toTimeString().slice(0, -34)}`;
	}

	let rooms = {};

	let currentRoom = "!fKJDAVVNRpnlmGfrIk:matrix.org";
	let currentRoomName;
	let currentRoomMessages = {};

	let client;

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
	}

	function changeRoom(roomId) {
		const room = client.getRoom(roomId);
		if (!room) return;
		currentRoom = roomId;
		currentRoomName = room.name;
		currentRoomMessages = [];
		for (const event of room.timeline) {
			if (event.getType() != "m.room.message") continue;
			currentRoomMessages[event.event.event_id] = { 
				created_at: event.event.origin_server_ts,
				room: room,
				member: room.getMember(event.getSender()),
				content: marked.parse(event.event.content.body) 
			};
		}
	}

	function fetchRooms() {
		for (const room of client.getRooms()) {
			rooms[room.roomId] = {
				roomCreator: room.myUserId,
				roomName: room.name
			};
		}
		rooms = rooms;
	}

	onMount(async () => {
		window.global ||= window;
		global.Olm = Olm;

		client = sdk.createClient({
			baseUrl: "https://matrix.org",
			accessToken: data.accessToken,
			userId: data.userId
		});
		await client.startClient();
		
		client.on("Room.timeline", (event, room) => {
			if (event.getType() != "m.room.message") return;
			if (room.roomId != currentRoom) return;
			currentRoomMessages[event.event.event_id] = { 
				created_at: event.event.origin_server_ts,
				room: room,
				member: room.getMember(event.getSender()),
				content: marked.parse(event.event.content.body) 
			};
		})

		client.on("RoomMember.typing", (_event, member) => {
			if (member.typing) personTyping = member.name + " is typing...";
			else personTyping = "";
		});

		client.on("sync", (state) => {
			if (state == "PREPARED") fetchRooms();
		});
		client.on("Room", () => fetchRooms());
	});

	function handleTypingUpdate(event) {
		if (event.detail.isTyping) client.sendTyping(currentRoom, true);
		else client.sendTyping(currentRoom, false);
	}

	function handleMessageUpdate(event) {		
		const content = {
			"body": event.detail.text,
			"msgtype": "m.text"
		};

		client.sendEvent(currentRoom, "m.room.message", content, "");
	}
</script>

<div class="flex flex-row grow space-x-8">
	<!-- Room list -->
	<div class="p-4 w-1/4 h-[100%] bg-slate-600">
		<h3 class="mb-4 font-semibold text-xl text-gray-400"> Your rooms </h3>
		<p class="text-sm text-gray-400">
			{#if Object.keys(rooms).length == 0}
				Loading...
			{:else}
				{#each Object.entries(rooms) as [ eventId, eventData ]}
					<button on:click={() => changeRoom(eventId)}> {eventData.roomName} </button>
					<button on:click={() => leaveRoom(eventId)}> ✕ </button>
					<br /><br />
				{/each}
			{/if}
		</p>
	</div>

	<!-- Messages -->
	<div class="flex flex-col grow mt-4 dark:text-white">
		{#if !currentRoomName}
			Please select a room!
		{:else}
			<h1 class="text-2xl"> Welcome to {currentRoomName}! </h1>
			<div class="flex flex-col mt-2 grow w-full overflow-y-scroll">
				{#each Object.values(currentRoomMessages) as eventData}
					<p>
						<b> {eventData.member.name} - {formatTime(eventData.created_at)} </b><br />
						{@html eventData.content}
					</p>
				{/each}
			</div>
			<TextBox on:typing={handleTypingUpdate} on:updated={handleMessageUpdate} typingText={personTyping} channel={currentRoomName} />
		{/if}
	</div>
</div>
