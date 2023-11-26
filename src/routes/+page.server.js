import { redirect } from '@sveltejs/kit';

export async function load({ cookies }) {
    let homeserver = cookies.get("homeserver");
    let userId = cookies.get("userId");
    let accessToken = cookies.get("accessToken");

    if (!homeserver || !userId || !accessToken) {
        throw redirect(302, "/login");
    }

    return { accessToken, userId, homeserver };
}
