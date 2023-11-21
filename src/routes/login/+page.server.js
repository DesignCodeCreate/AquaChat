import { error, redirect } from "@sveltejs/kit";
import sdk from "matrix-js-sdk";

export const actions = {
	sso: async ({ request, cookies, url }) => {
		const formData = await request.formData();
		const homeserver = formData.get("homeserver");
		
		if (!homeserver) {
			throw error(400, "Homeserver cannot be null");
		}
		
		const res = await fetch(`https://${homeserver}/_matrix/client/v3/login`, {
			method: "GET",
			headers: {
				accept: "application/json"
			}
		});
		let response = await res.json();
	
		for (let item of response.flows) {
			if (item.type == "m.login.sso") {
				if (homeserver) {
					cookies.set(
						"homeserver", homeserver,
						{
							path: "/",
							maxAge: 60 * 60 * 24 * 365
						}
					);
					throw redirect(302, `https://${homeserver}/_matrix/client/r0/login/sso/redirect?redirectUrl=${url.origin}/matrix_auth_callback`);
				}
			} else {
				throw error(400, "Homeserver not valid with SSO authentication, please login with username and password");
			}
		}
		
	},
	login: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = formData.get("username");
		const password = formData.get("password");
		const homeserver = formData.get("homeserver");

		let matrixClient;
	
		try {
			matrixClient = sdk.createClient({ baseUrl: `https://${homeserver}` });
			let userWithPrefix = username;
			if (!userWithPrefix.startsWith("@")) {
				userWithPrefix = `@${userWithPrefix}`;
			}
			if (!userWithPrefix.endsWith(`:${homeserver}`)) {
				userWithPrefix = `${userWithPrefix}:${homeserver}`;
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
				"homeserver", homeserver,
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
			throw error(400, e);
		}
		throw redirect(302, "/");
	}
}
