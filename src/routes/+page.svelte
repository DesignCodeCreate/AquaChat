<script>
	import TextBox from "../components/TextBox.svelte";

	export let data;

	let personTyping;

	import { Button, Spinner } from 'flowbite-svelte';



	import { marked } from "marked";

	let conversationinChannel = {};

	function formatTime(timestamp) {
		let date = new Date(parseInt(timestamp));
		return `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} - ${date.toTimeString().slice(0, -34)}`
	}
	
	import * as sdk from "matrix-js-sdk";
	import Olm from "olm";
	import { onMount } from "svelte";
    import { afterRead } from "@popperjs/core";

	let currentRoom = "!fKJDAVVNRpnlmGfrIk:matrix.org";

	let client;
	let currentRoomName;

	function getRoomMessages(roomId) {
		let room = client.getRoom(roomId);
		if (room) {
			room.timeline.forEach((event) => {
				if (event.getType() === "m.room.message") {
					conversationinChannel[event.event.event_id] = { 
						created_at: event.event.origin_server_ts,
						room: room,
						member: room.getMember(event.getSender()),
						content: marked.parse(event.event.content.body) 
					};
				}
			})
		}
	}

	function changeRoom(roomId) {
		conversationinChannel = [];
		currentRoomName = client.getRoom(roomId).name;
		getRoomMessages(roomId);
	}

	function getRooms() {
		let rooms = []
		Object.keys(client.store.rooms).forEach((roomId) => {
			let room = client.getRoom(roomId);
			rooms[roomId] = {
				roomCreator: room.myUserId,
				roomName: room.name
			}
		});
		return rooms
	}
	onMount(() => {
		window.global ||= window;
		global.Olm = Olm;


		client = sdk.createClient({
			baseUrl: "https://matrix.org",
			accessToken: data.accessToken,
			userId: data.userId
		});

		
		client.startClient();
		
		
		client.on("RoomMember.typing", (event, member) => {
			if (member.typing) {
				personTyping = member.name + " is typing...";
			} else {
				personTyping = "";
			}
		});

		client.on("Room.timeline", function (event, room, toStartOfTimeline) {
			if (event.getType() !== "m.room.message") {
				return;
			}
			getRoomMessages(currentRoom);
		});
	});

	

	function handleTypingUpdate(event) {
		if (event.detail.isTyping) {
    		client.sendTyping(currentRoom, true);
		} else {
    		client.sendTyping(currentRoom, false);
		}
	}

	function handleMessageUpdate(event) {		
		let content = {
			"body": event.detail.text,
			"msgtype": "m.text"
		};

		client.sendEvent(
			currentRoom,
			"m.room.message",
			content,
			""
		);
	}
	
</script>

{#if (!currentRoomName)}
<div class="centered">
	<Spinner size={14} color="red"></Spinner>
	<Button class="text-middle-centered" on:click={() => {
		changeRoom(currentRoom);
		getRoomMessages(currentRoom);
	}}> Load Chat </Button>
  </div>
{/if}

{#if currentRoomName}
  <div class="indented">
	<h1 style="font-size: 2em; color: white;">
	  Welcome to {currentRoomName}!
	</h1>
	<div class="flex flex-col w-full p-2 overflow-y-scroll">
	  {#each Object.entries(conversationinChannel) as [eventId, eventData]}
		<div class="text-align: center;">
		  <p class="dark:text-white">
			<b>{eventData.member.name} - {formatTime(eventData.created_at)}</b><br />
			{@html eventData.content}
		  </p>
		</div>
	  {/each}
	</div>
	<TextBox on:typing={handleTypingUpdate} on:updated={handleMessageUpdate} typingText={personTyping} channel={currentRoomName} />
  </div>
  

{/if}

{#if client}
<div class="server-list">
	<div class="flex items-center">
		<h5 id="drawer-label" class="inline-flex items-center mb-4 text-base font-semibold text-gray-500 dark:text-gray-400">Your Rooms</h5>
	</div>
	<p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
		{#each Object.entries(getRooms()) as [ eventId, eventData ]}
			<button on:click={() => {
				{currentRoomName}
				currentRoom = eventId;
				changeRoom(currentRoom);
			}}>{eventData.roomName}</button>
				<br><br/>
		{/each}
	</p>
</div>

{/if}


<style>
	.centered {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  .indented {
    margin-left: 325px;
  }
  .server-list {
	position: absolute;
    top: 40px;
    width: 250px;
    background: #2C2F33;
    color: white;
    padding: 10px;
    height: calc(100vh - 40px);
    overflow-y: auto;
    transform: translateY(8px);
  }
</style>