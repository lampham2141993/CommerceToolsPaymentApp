import { getConfig } from "../../../../dev-utils";

const config = getConfig();

// type of processor SupportedPaymentComponentsSchemaDTO
type SupportedPaymentComponents = {
	dropins: {
		type: "embedded" | "hpp";
	}[];
	components: {
		subtypes?: string[] | undefined;
		type: string;
	}[];
};

export const getPaymentMethods = async function (accessToken: string): Promise<SupportedPaymentComponents> {
	const paymentMethodsResponse = await fetch(`${config.PROCESSOR_URL}/operations/payment-components`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	return paymentMethodsResponse.json();
};
