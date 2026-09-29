import { getConfig } from "../../../getConfig";

export type DeleteBraintreeCustomerRequest = {
	customerId: string;
};

const config = getConfig();

export const deleteCustomer = async function (
	sessionId: string,
	request: DeleteBraintreeCustomerRequest,
): Promise<boolean> {
	let response!: Response;
	try {
		response = await fetch(`${config.PROCESSOR_URL}/customer/delete/${request.customerId}`, {
			method: "DELETE",
			headers: {
				"X-Session-Id": sessionId,
			},
		});
		if (response.ok) {
			return true;
		} else {
			console.log("Delete customer response: ", response);
			return false;
		}
	} catch (error) {
		console.log("Delete customer error: ", error);
		console.log("Delete customer response: ", response);
		return false;
	}
};
