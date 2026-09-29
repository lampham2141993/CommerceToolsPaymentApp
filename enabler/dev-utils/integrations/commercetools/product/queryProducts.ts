import type { Product } from "@commercetools/platform-sdk";
import { getConfig } from "../../../getConfig";
import { fetchAdminToken } from "../../../fetchAdminToken";

const config = getConfig();

export const queryProducts = async (): Promise<Product[]> => {
	const oauthAccessToken = await fetchAdminToken();
	const response = await fetch(`${config.CTP_API_URL}/${config.CTP_PROJECT_KEY}/products`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${oauthAccessToken}`,
		},
	});
	let products = await response.json();
	return products;
};
