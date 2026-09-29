import { getConfig } from "./getConfig";

const config = getConfig();

export const fetchAccessToken = async function (): Promise<string> {
	const tokenResponse = await fetch("http://localhost:9002/jwt/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			iss: "https://issuer.com",
			sub: "test-sub",
			"https://issuer.com/claims/project_key": `${config.CTP_PROJECT_KEY}`,
		}),
	});

	const accessToken = await tokenResponse.json();
	return accessToken.token;
};
