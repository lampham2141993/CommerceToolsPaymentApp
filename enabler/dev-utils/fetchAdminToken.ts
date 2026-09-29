import { getConfig } from "./getConfig";

const config = getConfig();

export const fetchAdminToken = async (): Promise<string> => {
	const myHeaders = new Headers();

	myHeaders.append("Authorization", `Basic ${btoa(`${config.CTP_CLIENT_ID}:${config.CTP_CLIENT_SECRET}`)}`);
	myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

	var urlencoded = new URLSearchParams();
	urlencoded.append("grant_type", "client_credentials");
	//urlencoded.append('scope', __ADMIN_SCOPE__);

	const response = await fetch(`${config.CTP_AUTH_URL}/oauth/token`, {
		body: urlencoded,
		headers: myHeaders,
		method: "POST",
		redirect: "follow",
	});

	const token = await response.json();

	if (response.status !== 200) {
		console.log({
			title: "Token fetch failed",
			message: `Error ${response.status} while fetching token`,
		});
		throw new Error(`Error ${response.status} while fetching token`);
	} else {
		console.log({
			title: "Token fetched",
			message: `Token fetched: ${token.access_token}`,
		});
	}
	console.log("Token fetched:", token);
	return token.access_token;
};
