import { error, redirect } from "@sveltejs/kit";
import sdk from "matrix-js-sdk";

export const actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = formData.get("username");
		const password = formData.get("password");

		let matrixClient;
	
		try {
			matrixClient = sdk.createClient({ baseUrl: "https://matrix.org" });

			let userWithPrefix = username;
			if (!userWithPrefix.startsWith("@")) {
				userWithPrefix = `@${userWithPrefix}`;
			}
			if (!userWithPrefix.endsWith(":matrix.org")) {
				userWithPrefix = `${userWithPrefix}:matrix.org`;
			}
			await matrixClient.login("m.login.password", {
				user: userWithPrefix,
				password: password
			});

			cookies.set(
				"accessToken", matrixClient.getAccessToken(),
				{
					path: "/",
					maxAge: 60 * 60 * 24 * 365
				}
			);
			cookies.set(
				"userId", matrixClient.getUserId(),
				{
					path: "/",
					maxAge: 60 * 60 * 24 * 365
				}
			);
		} catch (e) {
			console.log(e);
			throw error(400, "Invalid login or password");
		}

		throw redirect(302, "/");
	}
}
