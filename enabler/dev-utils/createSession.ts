import { getConfig } from "./getConfig";
import { fetchAdminToken } from "./fetchAdminToken";
import { cocoSessionStore } from "../src/store";
import type { Session } from "../src/store/stores/CoCoSessionStore";

const config = getConfig();

export const createSession = async (cartId: string): Promise<void> => {
	const accessToken = await fetchAdminToken();

	const sessionMetadata = {
		processorUrl: config.PROCESSOR_URL,
		allowedPaymentMethods: ["card", "invoice", "purchaseorder"], // add here your allowed methods for development purposes
	};

	const url = `${config.CTP_SESSION_URL}/${config.CTP_PROJECT_KEY}/sessions`;

	const res = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		},
		body: JSON.stringify({
			cart: {
				cartRef: {
					id: cartId,
				},
			},
			metadata: sessionMetadata,
		}),
	});
	const data = await res.json();

	if (!res.ok) {
		console.error("Not able to create session:", url, data);
		throw new Error("Not able to create session");
	}

	const session: Session = {
		id: data.id,
		expires: Date.now() + 1000 * 60 * 60,
		activeCart: {
			cartRef: {
				id: cartId,
			},
		},
	};

	console.log("Session created:", session);

	cocoSessionStore.dispatch({
		type: "SET_SESSION",
		session,
	});
};
