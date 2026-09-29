import { paypalCheckout, type PayPalCheckout, type PayPalCheckoutCreatePaymentOptions } from "braintree-web";
import type { PaymentResponseSchemaDTO } from "../../../dtos/PaymentResponseSchemaDTO";
import { type BaseOptions, type ComponentOptions, PaymentMethod, type PaymentResult } from "../../../payment-enabler";
import { BaseComponent } from "../../BaseComponent";

export class PayPal extends BaseComponent {
	private amount: string;
	private currencyCode: string;
	private paypalCheckoutInstance?: PayPalCheckout;

	constructor(baseOptions: BaseOptions, componentOptions: ComponentOptions) {
		super(PaymentMethod.paypal, baseOptions, componentOptions);
		this.amount = baseOptions.amount;
		this.currencyCode = baseOptions.currencyCode;
	}

	async mount(containerId: string) {
		const container = document.querySelector(containerId);
		if (!container) {
			throw new Error(`Container with selector "${containerId}" not found`);
		}
		container.insertAdjacentHTML("afterbegin", '<div id="braintree-paypal-button"></div>');

		this.paypalCheckoutInstance = await paypalCheckout.create({
			client: this.sdk,
		});
		await this.paypalCheckoutInstance.loadPayPalSDK({
			currency: this.currencyCode,
			intent: "authorize",
			vault: false,
		});

		const paypalSdk = window.paypal;
		if (!paypalSdk) {
			throw new Error("PayPal SDK did not load");
		}

		paypalSdk
			.Buttons({
				createOrder: () => {
					if (!this.paypalCheckoutInstance) {
						throw new Error("PayPal Checkout is not initialized");
					}
					return this.paypalCheckoutInstance.createPayment({
						flow: "checkout" as PayPalCheckoutCreatePaymentOptions["flow"],
						amount: this.amount,
						currency: this.currencyCode,
						intent: "authorize" as PayPalCheckoutCreatePaymentOptions["intent"],
					});
				},
				onApprove: async (data) => {
					if (!this.paypalCheckoutInstance) {
						throw new Error("PayPal Checkout is not initialized");
					}
					const payload = await this.paypalCheckoutInstance.tokenizePayment(data);
					await this.complete(payload.nonce);
					return {
						nonce: payload.nonce,
						type: payload.type,
						details: payload.details,
					};
				},
				onError: (error) => {
					this.onError(new Error(error));
				},
			})
			.render("#braintree-paypal-button");
	}

	async submit() {
		this.onError(new Error("Use the PayPal button to approve the payment"));
	}

	private async complete(nonce: string) {
		try {
			const response = await fetch(this.processorUrl + "/payment", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Session-Id": this.sessionId,
				},
				body: JSON.stringify({
					nonce,
					paymentMethodType: "paypal",
					paymentReference: this.paymentReference,
				}),
			});
			const createPaymentResponse: PaymentResponseSchemaDTO = await response.json();
			const paymentResult: PaymentResult = createPaymentResponse.success
				? {
						isSuccess: true,
						paymentReference: createPaymentResponse.paymentReference ?? "",
					}
				: {
						isSuccess: false,
						paymentReference: createPaymentResponse.paymentReference ?? "",
						message: createPaymentResponse.message ?? "",
					};
			this.onComplete(paymentResult);
		} catch (error) {
			this.onError(error);
		}
	}
}
