import { getConfig } from "../../../getConfig";

export type CreateBraintreeCustomerRequest = {
	firstName: string;
	lastName: string;
	email: string;
	company?: string;
	phone?: string;
	website?: string;
	customFields?: string;
};

type CreateBraintreeCustomerResponse = CreateBraintreeCustomerRequest & {
	id: string;
};

const config = getConfig();

export const createCustomer = async function (
	sessionId: string,
	createCustomerRequest: CreateBraintreeCustomerRequest,
): Promise<CreateBraintreeCustomerResponse | false> {
	let response!: Response;
	try {
		response = await fetch(`${config.PROCESSOR_URL}/customer/create`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Session-Id": sessionId,
			},
			body: JSON.stringify(createCustomerRequest),
		});

		const customer = await response.json();
		return customer;
	} catch (error) {
		console.log("Create customer error: ", error);
		console.log("Create customer response: ", response);
		return false;
	}
};
