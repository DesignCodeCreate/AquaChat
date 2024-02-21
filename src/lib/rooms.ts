import { parse as marked } from "marked";
import { Visibility } from "matrix-js-sdk";

import type { MatrixClient, RoomMember } from "matrix-js-sdk";

export type Room = {
	name: string,
	unread: number,
	avatar: string | null,
	peopleTyping: { [memberId: string]: string }
};

export type Message = {
	created_at: Number,
	room: string,
	member: RoomMember,
	content: string
};

export type Member = {
	userId: string,
	displayName: string,
	avatar: string,
	presence: string
};

export type RoomDetails = {
	id: string,
	name: string,
	messages: { [id: number]: Message },
	members: { [id: string]: Member }
};

export async function changeRoom(client: MatrixClient, roomId: string) {
	const room = client.getRoom(roomId);
	if (!room) return;
	const initialSync = await client.roomInitialSync(roomId, 300);

	let roomDetails: RoomDetails = {
		id: roomId,
		name: room.name,
		messages: [],
		members: {}
	};

	for (const message of initialSync.messages?.chunk ?? []) {
		if (message.type != "m.room.message") continue;

		roomDetails.messages[message.event_id] = {
			created_at: message.origin_server_ts,
			room: roomId,
			member: room.getMember(message.sender),
			content: message.content.body ? marked(message.content.body) : "<i> This message was deleted </i>"
		};
	}

	// @ts-expect-error
	for (const presence of initialSync.presence) {
		const content = presence.content;
		const user = client.getUser(content.user_id);
		roomDetails.members[user.userId] = {
			userId: user.userId,
			displayName: user?.rawDisplayName ?? "?",
			avatar: client.mxcUrlToHttp(user?.avatarUrl ?? ""),
			presence: content.presence
		};
	}

	return roomDetails;
}

export async function fetchRooms(client: MatrixClient) {
	let rooms: { [id: string]: Room } = {};
	for (const room of client.getRooms()) {
		let initialSync = await client.roomInitialSync(room.roomId, 10);
		rooms[room.roomId] = {
			name: room.name,
			// @ts-expect-error
			unread: room.notificationCounts.total,
			avatar: null,
			peopleTyping: {}
		};
		for (const event of initialSync.state ?? []) {
			if (event.type == "m.room.avatar" && event.content.url) {
				rooms[room.roomId].avatar = client.mxcUrlToHttp(event.content.url);
			}
		}
	}
	return rooms;
}

async function editRoomName(client: MatrixClient, roomId: string, newName: string) {
	await client.sendStateEvent(roomId, "m.room.name", {
		room_id: roomId,
		type: "m.room.name",
		content: { name: newName }
	});
}

async function createRoom(client: MatrixClient) {
	const createRoomResponse = await client.createRoom({ visibility: Visibility.Private });
	const roomId = createRoomResponse.room_id;
	return roomId;
}
