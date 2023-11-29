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

	let client;
	let rooms = {};

	const scrollToBottom = async (node) => {
		node.scroll({ top: node.scrollHeight, behavior: 'smooth' });
	}; 

	let currentRoomDetails = {
		id: undefined,
		name: undefined,
		messages: {},
		members: {}
	};

	let loading = true;
	let messageView = {};
	let peopleTyping = {};
	let sounds = {};
	let leaveRoomPopup = null;
	let showDeleteMessagePopup = null;

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

		let initialSync = await client.roomInitialSync(roomId, 300);

		for (const message of initialSync.messages.chunk) {
			if (message.type != "m.room.message") continue;

			currentRoomDetails.messages[message.event_id] = {
				created_at: message.origin_server_ts,
				room: room,
				member: room.getMember(message.sender),
				content: message.content.body ? marked.parse(message.content.body) : "<i> This message was deleted </i>"
			};
		}
	
		for (const user of initialSync.presence) {
			currentRoomDetails.members[user.content.user_id] = { displayName: user.content.user_id, presence: user.content.presence };
		}

	 	currentRoomDetails = currentRoomDetails;
		
		await new Promise(resolve => setTimeout(resolve));
		await scrollToBottom(messageView);
	}

	function getProfilePicture(member) {
		if (member) {
			return client.mxcUrlToHttp(client.getUser(member.displayName).avatarUrl);	
		}
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
				content: event.event.content.body ? marked.parse(event.event.content.body) : "<i> This message was deleted </i>"
			};

			try {
				if (event.getSender() != data.userId) sounds.message.play();
			} catch {}

			scrollToBottom(messageView);
		});

		client.on("RoomMember.typing", (_event, member) => {
			if (member.userId != data.userId) {
				peopleTyping[member.name] = member.typing;
			}
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

	function sendMessage({ detail }) {
		const content = {
			"body": detail,
			"msgtype": "m.text"
		};

		client.sendEvent(currentRoomDetails.id, "m.room.message", content, "");
	}
	
	function deleteMessage(messageId) {
		if (currentRoomDetails.messages[messageId].member.userId != data.userId) {
			console.log("You don't have permission to do that!")
		} else {
			client.redactEvent(currentRoomDetails.id, messageId);
			currentRoomDetails.messages[messageId].content = "<i> This message was deleted </i>";
		}
	}

	function pauseSounds() {
		for (let i of Object.keys(sounds)) {
			sounds[i].pause();
		}
	}
</script>

<svelte:head>
	<title> {currentRoomDetails.name ? (`${currentRoomDetails.name} -`) : ""} AquaChat </title>
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
		<img class="w-32 h-32 place-self-center animate-bounce" src="/assets/images/fish.png" alt="Fish" />
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
			
				<h1 class="text-2xl"> {currentRoomDetails.name} </h1>
				<div bind:this={messageView} class="flex flex-col mt-2 grow w-full overflow-y-auto">
					{#each Object.entries(currentRoomDetails.messages) as [ eventId, eventData ]}
						<Message client={client} message={eventData} on:deleted={() => showDeleteMessagePopup = eventId}/>
					{/each}
	
					<br />
					<br />
					<br />

					{#if showDeleteMessagePopup}
						<Popup
							title="Delete message?"
							description={`Are you sure you want to delete the message?`}
							on:confirm={() => {
								deleteMessage(showDeleteMessagePopup);
								showDeleteMessagePopup = null;
							}}
							on:cancel={() => showDeleteMessagePopup = null}
						/>
					{/if}
				</div>		
				<TextBox
					on:typing={({ detail }) => client.sendTyping(currentRoomDetails.id, detail)}
					on:updated={sendMessage}
					peopleTyping={peopleTyping}
					channel={currentRoomDetails.name}
				/>
			{/if}
		</div>

		<!-- User list -->
		<div class="flex-shrink p-4 w-1/4 max-h-full overflow-y-auto flex-grow-0 flex-shrink-0 bg-slate-200 dark:bg-slate-600 space-y-4">
			<!-- Online members -->
			<div class:hidden={Object.keys(currentRoomDetails.members).length <= 0}>
				<h3 class="mb-2 font-semibold text-xl dark:text-gray-400 text-gray-700"> Online - {Object.values(currentRoomDetails.members).filter(member => member.presence === "online").length} </h3>
				<p class="text-sm dark:text-gray-400 text-gray-700">
					{#each Object.values(currentRoomDetails.members) as member}
						{#if member.presence == "online"}
						
						<div class="flex-1">
							{#if getProfilePicture(member)}
								<div class="flex-1">
									<div style="display:inline-block; margin-bottom:-15px;">
										<div
										class="w-10 h-10 bg-cover bg-center rounded-full"
										style={`background-image: url('${getProfilePicture(member)}');`}
										alt="Profile picture"
										/>
									</div>
									<div style="display:inline-block;">
										<b>{client.getUser(member.displayName).rawDisplayName}</b><br />
									</div>    
								</div>		
							{:else}
								<div class="flex-1">
									<div style="display:inline-block; margin-bottom:-15px;">
										<div
										class="flex w-10 h-10 justify-center items-center bg-orange-400 font-bold text-white rounded-full"
										style={`background-image: url('${getProfilePicture(member)}');`}
										alt="Profile picture"
										/>
									</div>
									<div style="display:inline-block;">
										<b>{member.name[0].toUpperCase()}</b><br />
									</div>    
								</div>
							{/if}
						</div>			
						{/if}
						<br>
					{/each}
				</p>
			</div>

			<!-- Offline members-->
			<div class:hidden={Object.keys(currentRoomDetails.members).length <= 0}>
				<h3 class="mb-2 font-semibold text-xl dark:text-gray-400 text-gray-700"> Offline - {Object.values(currentRoomDetails.members).filter(member => member.presence === "offline").length} </h3>
				<p class="text-sm dark:text-gray-400 text-gray-700">
					{#each Object.values(currentRoomDetails.members) as member}
						{#if member.presence == "offline"}
							{#if getProfilePicture(member)}
								<div class="flex-1">
									<div style="display:inline-block; margin-bottom:-15px;">
										<div
										class="opacity-40 w-10 h-10 bg-cover bg-center rounded-full"
										style={`background-image: url('${getProfilePicture(member)}');`}
										alt="Profile picture"
										/>
									</div>
									<div class="opacity-40" style="display:inline-block;">
										<b>{client.getUser(member.displayName).rawDisplayName}</b><br />
									</div>    
								</div>		
							{:else}
								<div class="flex-1">
									<div style="display:inline-block; margin-bottom:-15px;">
										<div
										class="opacity-40 flex w-10 h-10 justify-center items-center bg-orange-400 font-bold text-white rounded-full"
										alt="Profile picture"
										>
										{client.getUser(member.displayName).rawDisplayName[0].toUpperCase()}
										</div>
									</div>
									<div class="opacity-40" style="display:inline-block;">
										<b>{client.getUser(member.displayName).rawDisplayName}</b><br />
									</div>   
								</div>
							{/if}
						{/if}
						<br>
					{/each}
				</p>
			</div>
		</div>
	</div>
{/if}
