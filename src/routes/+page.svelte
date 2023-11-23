<script>
	import { marked } from "marked";
	import * as sdk from "matrix-js-sdk";
	import Olm from "olm";
	import { onMount } from "svelte";

	import TextBox from "../components/TextBox.svelte";

	export let data;

	let peopleTyping = {};

	function formatTime(timestamp) {
		let date = new Date(parseInt(timestamp));
		return `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} - ${date.toTimeString().slice(0, -34)}`;
	}

	let rooms = {};

	let currentRoomDetails = {
		id: undefined,
		name: undefined,
		messages: {},
		members: {}
	};

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
		client.sendEvent(currentRoomDetails.id, "m.fully_read", { event_id: roomId }, "");


		for (const message of (await client.roomInitialSync(roomId)).messages.chunk) {
			if (message.type != "m.room.message") continue;			
			currentRoomDetails.messages[message.event_id] = { 
				created_at: message.origin_server_ts,
				room: room,
				member: room.getMember(message.sender),
				content: marked.parse(message.content.body)
			};
		}
	}

	async function fetchMembers(roomId) {
		if (!roomId) return;
		const room = client.getRoom(roomId);
		if (!room) return;

		const members = room.getJoinedMembers();
		currentRoomDetails.members = {};

		for (let member of members) {
			if (!member.userId) continue;
			const presenceState = await client.getPresence(member.userId);
			currentRoomDetails.members[member.userId] = { displayName: member.name, presence: presenceState.presence };	
		}
		
		return { members: Object.values(currentRoomDetails.members) };
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
		});

		client.on("RoomMember.typing", (_event, member) => {
			peopleTyping[member.name] = member.typing;
		});

		client.on("sync", (state) => {
			if (state != "PREPARED") return;
			fetchRooms();
		});

		client.on("m.presence", (_event, member) => {
			fetchMembers();
		});

		client.on("Room", () => fetchRooms());
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
</script>

<div class="flex flex-row grow space-x-8 h-full">
	<!-- Room list -->
	<div class="p-4 w-1/4 max-h-full bg-slate-600 overflow-y-auto flex-grow-0 flex-shrink-0">
		<h3 class="mb-4 font-semibold text-xl text-gray-400"> Your rooms </h3>
		<p class="text-sm text-gray-400">
			{#if Object.keys(rooms).length == 0}
				Loading...
			{:else}
				{#each Object.entries(rooms) as [ eventId, eventData ]}
					<button on:click={() => changeRoom(eventId)}> {eventData.roomName} </button>
					<button on:click={() => leaveRoom(eventId)}> ✕ </button>
					{eventData.unread}
					<br /><br />
				{/each}
			{/if}
		</p>
	</div>

	<!-- Messages -->
	<div class="flex flex-col grow mt-4 dark:text-white max-h-full overflow-y-auto flex-grow">
		{#if !currentRoomDetails["name"]}
			Please select a room!
		{:else}
			<h1 class="text-2xl"> Welcome to {currentRoomDetails["name"]}! </h1>
			<div class="flex flex-col mt-2 grow w-full overflow-y-auto">
				{#each Object.values(currentRoomDetails["messages"]) as eventData}
					<p>
						<b> {eventData.member.name} - {formatTime(eventData.created_at)} </b><br />
						{@html eventData.content}
					</p>
				{/each}
			</div>
			<TextBox on:typing={handleTypingUpdate} on:updated={handleMessageUpdate} peopleTyping={peopleTyping} channel={currentRoomDetails["name"]} />
		{/if}
	</div>

	<!-- User list -->
	<div class="flex-shrink p-4 w-1/4 max-h-full bg-slate-600 overflow-y-auto flex-grow-0 flex-shrink-0">
		<h3 class="mb-4 font-semibold text-xl text-gray-400"> Online - {Object.values(currentRoomDetails.members).filter(member => member.presence === "online").length} </h3>
		<p class="text-sm text-gray-400">
			{#each Object.entries(currentRoomDetails.members) as [userId, member]}
				<p class="font-bold">
					{#if member.presence === "online"}
						{member.displayName} - Online
					{/if}
				</p>
			{/each}
		</p>

		{#if currentRoomDetails.members && Object.keys(currentRoomDetails.members).length > 0}
			<h3 class="mb-4 font-semibold text-xl text-gray-400"> Offline - {Object.values(currentRoomDetails.members).filter(member => member.presence === "offline").length} </h3>
			<p class="text-sm text-gray-400">
				{#each Object.entries(currentRoomDetails.members) as [userId, member]}
					<p class="font-bold">
						{#if member.presence === "offline"}
							{member.displayName} - Offline
						{/if}
					</p>
				{/each}
			</p>
		{/if}
	</div>
</div>