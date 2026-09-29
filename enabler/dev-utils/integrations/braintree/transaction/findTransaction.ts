import { getConfig } from "../../../getConfig";

type Transaction = {
	id: string;
	additionalProcessorResponse: string;
	amount: string;
	status:
		| "authorization_expired"
		| "authorized"
		| "authorizing"
		| "settlement_confirmed"
		| "settlement_pending"
		| "settlement_declined"
		| "failed"
		| "gateway_rejected"
		| "processor_declined"
		| "settled"
		| "settling"
		| "submitted_for_settlement"
		| "voided";
	statusHistory?: Array<{
		amount: string;
		status: string;
		timestamp: string;
		transactionsource: "Api" | "ControlPanel" | "Recurring";
		user: string;
	}>;
};

const config = getConfig();

export const findTransaction = async function (sessionId: string, transactionId: string): Promise<Transaction> {
	let response!: Response;
	try {
		response = await fetch(`${config.PROCESSOR_URL}/transaction/find/${transactionId}`, {
			method: "GET",
			headers: {
				"X-Session-Id": sessionId,
			},
		});

		const transaction = await response.json();
		return transaction;
	} catch (error) {
		console.log("Find transaction error: ", error);
		console.log("Find transaction response: ", response);
		throw error;
	}
};
