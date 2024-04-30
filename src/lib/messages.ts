import type { MatrixClient } from "matrix-js-sdk";

export async function sendMessage(client: MatrixClient, room: string, content: string) {
    await client.sendEvent(room, "m.room.message", {
        "body": content,
        "msgtype": "m.text"
    });
}

export function deleteMessage(client: MatrixClient, roomId: string, messageId: string) {
    try {
        client.redactEvent(roomId, messageId);
    } catch (e) {
        console.error(e);
    }
}
