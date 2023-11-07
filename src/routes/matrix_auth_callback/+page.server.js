import { redirect } from "@sveltejs/kit";
import * as sdk from "matrix-js-sdk";

export async function load({ url, cookies }) {
    let matrixClient = sdk.createClient({ baseUrl: "https://matrix.org" });
    await matrixClient.login("m.login.token", { token: url.searchParams.get("loginToken") });

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

    throw redirect(302, "/");
}
