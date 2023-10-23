<script>
	import TextBox from "../components/TextBox.svelte";
	
	let personTyping;
	
	import { marked } from "marked";

	import { env } from "$env/dynamic/public";

	let conversationinChannel = {};

	function formatTime(timestamp) {
		let date = new Date(parseInt(timestamp));
		return `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} - ${date.toTimeString().slice(0, -34)}`
	}
	
	import * as sdk from "matrix-js-sdk";
	import Olm from "olm";
	import { onMount } from "svelte";

	let client;
	const testRoomId = "!fKJDAVVNRpnlmGfrIk:matrix.org";
	
	function initMatrix() {
		window.global ||= window;
		global.Olm = Olm;

		client = sdk.createClient({
			baseUrl: "https://matrix.org",
			accessToken: "syt_ZGVzaWduaW5nYzBkaW5nY3JlYXRpbmc_vBVQzUPanExJjszhspkJ_3u2OxL",
			userId: "@designingc0dingcreating:matrix.org"
		});
		client.initCrypto();
		client.startClient();

		client.on("Room.timeline", (event, room, toStartOfTimeline) => {
			if (event.getType() !== "m.room.message") return;
			conversationinChannel[event.event.origin_server_ts] = event.event.content.body;
		});

		client.on("RoomMember.typing", (event, member) => {
			if (member.typing) {
				personTyping = member.name + "is typing...";
			} else {
				personTyping = "";
			}
		});
	}
	
	onMount(initMatrix);

	function handleTypingUpdate(event) {
		client.sendEvent(testRoomId, "RoomMember.typing", { typing: event.detail.isTyping } ,"@designingc0dingcreating:matrix.org", (err, res) => { console.log(err); });
	}

	function handleMessageUpdate(event) {		
		let content = {
			"body": event.detail.text,
			"msgtype": "m.text"
		};
		
		client.sendEvent(
			testRoomId,
			"m.room.message",
			content,
			""
		).then((res) => {}).catch((err) => {
			console.error(err);
		});
	}

</script>

<div class="flex flex-col w-full p-2 overflow-y-scroll">
	{#each Object.entries(conversationinChannel) as [ created_at, content ]}
		<div class="text-align: center;">
			<p class="dark:text-white">
				<b> User - {formatTime(created_at)} </b><br />
				{@html content}
			</p>
		</div>
	{/each}
</div>

<TextBox on:typing={handleTypingUpdate} on:updated={handleMessageUpdate} />

{#if personTyping}
	<p><b>{personTyping}</b></p>
{/if}