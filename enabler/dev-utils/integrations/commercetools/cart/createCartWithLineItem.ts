import type { Cart } from "@commercetools/platform-sdk";
import { getConfig } from "../../../getConfig";
import { Guid } from "../../../Guid";

const config = getConfig();

export const createCartWithLineItem = async function (oauthAccessToken: string, cartKey: string): Promise<Cart> {
	const response = await fetch(`${config.CTP_API_URL}/${config.CTP_PROJECT_KEY}/carts`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${oauthAccessToken}`,
		},
		body: JSON.stringify({
			key: cartKey,
			currency: "EUR",
			lineItems: [
				{
					id: 1,
					sku: "WOP-09",
				},
			],
			anonymousId: Guid.NewGuid(),
			taxMode: "Platform",
			taxRoundingMode: "HalfEven",
			taxCalculationMode: "LineItemLevel",
			inventoryMode: "ReserveOnOrder",
			shippingMode: "Single",
			shippingAddress: {
				streetName: "testStreet",
				country: "DE",
			},
			shipping: [],
			country: "DE",
			origin: "Customer",
			itemShippingAddresses: [],
			deleteDaysAfterLastModification: 90,
		}),
	});

	let cart: Cart = await response.json();

	return cart;
};
