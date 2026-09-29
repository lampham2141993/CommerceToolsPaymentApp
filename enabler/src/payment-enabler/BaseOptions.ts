import { type PaymentResult } from "./PaymentResult";
import type { Client } from "braintree-web";

// export type BraintreeClientType = Awaited<ReturnTypetypeof client.create>;
// export type BraintreeClientType = Awaited<ReturnType<typeof client.create<{authorization: string}>>>

export type BaseOptions = {
	sdk: Client;
	processorUrl: string;
	sessionId: string;
	paymentReference?: string;
	amount: string;
	currencyCode: string;
	onComplete: (result: PaymentResult) => void;
	onError: (error?: any) => void;
};
