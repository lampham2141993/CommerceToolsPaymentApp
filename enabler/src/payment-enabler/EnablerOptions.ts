import { type PaymentResult } from "./PaymentResult";

/**
 * Represents the options for the payment enabler.
 */
export type EnablerOptions = {
	/**
	 * The URL of the payment processor.
	 */
	processorUrl: string;

	/**
	 * The session ID for the payment.
	 */
	sessionId: string;

	/**
	 * The currency of the payment.
	 */
	currency?: string;

	/**
	 * A callback function that is called when an action is required during the payment process.
	 * @returns A promise that resolves when the action is completed.
	 */
	onActionRequired?: () => Promise<void>;

	/**
	 * A callback function that is called when the payment is completed.
	 * @param result - The result of the payment.
	 */
	onComplete?: (result: PaymentResult) => void;

	/**
	 * A callback function that is called when an error occurs during the payment process.
	 * @param error - The error that occurred.
	 */
	onError?: (error: any) => void;
};
