import { type PaymentEnabler } from "./PaymentEnabler";
import { type BaseOptions } from "./BaseOptions";
import { type EnablerOptions } from "./EnablerOptions";
import { type PaymentComponentBuilder } from "./PaymentComponentBuilder";
import { CardBuilder } from "../components/payment-methods/card";
import { PayPalBuilder } from "../components/payment-methods/paypal";
import { client } from "braintree-web";
import type { Client } from "braintree-web";

export class BraintreePaymentEnabler implements PaymentEnabler {
	setupData: Promise<{ baseOptions: BaseOptions }>;

	constructor(options: EnablerOptions) {
		this.setupData = BraintreePaymentEnabler._Setup(options);
	}

	private static _Setup = async (options: EnablerOptions): Promise<{ baseOptions: BaseOptions }> => {
		const { clientToken, paymentReference, amount, currencyCode } =
			await BraintreePaymentEnabler.getBraintreeToken(options);

		const braintreeClient: Client = await client.create({
			authorization: clientToken,
		});

		return {
			baseOptions: {
				sdk: braintreeClient,
				processorUrl: options.processorUrl,
				sessionId: options.sessionId,
				paymentReference,
				amount,
				currencyCode,
				onComplete: options.onComplete || (() => {}),
				onError: options.onError || (() => {}),
			},
		};
	};

	private static getBraintreeToken = async (
		options: EnablerOptions,
	): Promise<{ clientToken: string; paymentReference: string; amount: string; currencyCode: string }> => {
		let response!: Response;
		let initResponse;
		try {
			response = await fetch(`${options.processorUrl}/init`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Session-Id": options.sessionId,
				},
				body: JSON.stringify({}),
			});

			initResponse = await response.json();

			if (initResponse.statusCode >= 400) {
				throw new Error(`Failed to get Braintree token: ${initResponse.message}`, initResponse.errors);
			}
			return {
				clientToken: initResponse.clientToken,
				paymentReference: initResponse.paymentReference,
				amount: initResponse.amount,
				currencyCode: initResponse.currencyCode,
			};
		} catch (error: Error | any) {
			if (typeof options.onError === "function") {
				options.onError(error);
			}
			throw error;
		}
	};

	async createComponentBuilder(type: string): Promise<PaymentComponentBuilder | never> {
		const { baseOptions } = await this.setupData;

		const supportedMethods = {
			card: CardBuilder,
			paypal: PayPalBuilder,
		};

		if (!Object.keys(supportedMethods).includes(type)) {
			throw new Error(
				`Component type not supported: ${type}. Supported types: ${Object.keys(supportedMethods).join(", ")}`,
			);
		}

		return new supportedMethods[type as keyof typeof supportedMethods](baseOptions);
	}
}
