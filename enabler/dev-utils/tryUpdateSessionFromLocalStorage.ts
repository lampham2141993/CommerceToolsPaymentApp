import { CookieHelpers } from "./helpers/CookieHelpers";
import { cocoSessionStore } from "../src/store";
import { createSession } from "./createSession";

export const tryUpdateSessionFromLocalStorage = async function () {
	const session = CookieHelpers.getSession();

	if (!session?.activeCart.cartRef.id) {
		return;
	}

	// if session is expired or will within 5 minutes
	if (session.expires - Date.now() < 1000 * 60 * 5) {
		console.log(
			`Session has expired, or will within 5 minutes. Creating new session with cart ID: ${session.activeCart.cartRef.id}`,
		);
		await createSession(session.activeCart.cartRef.id);
		return;
	} else {
		cocoSessionStore.dispatch({ type: "SET_SESSION", session });
		console.log(`Session expires in ${(session.expires - Date.now()) / 1000 / 60} minutes.`);
	}
};
