<script>
	import { createClient } from "@supabase/supabase-js";
	import { marked } from "marked";

	import TextBox from "../components/TextBox.svelte";
	import { DarkMode } from "flowbite-svelte";

	import { env } from "$env/dynamic/public";
	const supabase = createClient("https://aulykkyjpimknsionejk.supabase.co", env.PUBLIC_SUPABASE_KEY);
	
	let channel = "testchannel";
	let message = "";

	let conversation = {};

	
	async function getConversation() {
		const { data, error } = await supabase.from("conversation").select();
		data.forEach((message) => {
			conversation[message.created_at] = marked.parse(message.content);
		});
	}
	getConversation();

	function makeRightTime(string) {
		let date = new Date(string);
		return `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} - ${date.toTimeString().slice(0, -34)}`
	}

	supabase.channel(channel).on(
		"postgres_changes",
		{
			event: "INSERT",
			schema: "public",
			table: "conversation"
		},
		(payload) => {
			conversation[payload.new.created_at] = payload.new.content;
		}
	).subscribe();

	async function handleMessageUpdate(event) {
		const { error } = await supabase.from("conversation").insert({ content: event.detail.text });
		if (error) console.error(error);
	}
</script>

<DarkMode position="fixed" style="float: right;"/>

<div class="flex flex-col w-full h-full overflow-y-scroll">
	{#each Object.entries(conversation) as [ created_at, content ]}
		<p class="dark:text-white">
			<b> User - {makeRightTime(created_at)} </b><br />
			{@html content}
		</p>
	{/each}
</div>

<TextBox channel={channel} on:updated={handleMessageUpdate}></TextBox>	