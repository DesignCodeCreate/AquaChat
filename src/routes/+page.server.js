import { redirect } from '@sveltejs/kit';

export async function load({ cookies }) {
    let accessToken = cookies.get("accessToken");
    let userId = cookies.get("userId");

    if (!accessToken || !userId) {
        throw redirect(302, "/login");
    }

    return { accessToken, userId };
}