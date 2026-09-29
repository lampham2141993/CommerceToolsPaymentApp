import { type BaseOptions, type ComponentOptions, PaymentMethod, type PaymentResult } from "../../../payment-enabler";

import { BaseComponent } from "../../BaseComponent";
import { type Client, hostedFields, type HostedFields, type HostedFieldsEvent } from "braintree-web";
import type { PaymentResponseSchemaDTO } from "../../../dtos/PaymentResponseSchemaDTO";
import type {
	HostedFieldsHostedFieldsFieldData,
	HostedFieldsState,
	HostedFieldsTokenizePayload,
} from "braintree-web/hosted-fields";

export class Card extends BaseComponent {
	private showPayButton: boolean;
	private hostedFieldsInstance: HostedFields | undefined;
	private hasComponentRendered: boolean = false;
	private tokenizedPayload: HostedFieldsTokenizePayload | undefined;

	constructor(baseOptions: BaseOptions, componentOptions: ComponentOptions) {
		super(PaymentMethod.card, baseOptions, componentOptions);
		this.showPayButton = componentOptions?.showPayButton ?? false;
	}

	async mount(containerId: string) {
		const container = document.querySelector(containerId);
		if (!container) {
			throw new Error(`Container with selector "${containerId}" not found`);
		}
		container.insertAdjacentHTML("afterbegin", this._getTemplate());
		if (!this.hostedFieldsInstance)
			this.hostedFieldsInstance = await hostedFields.create({
				client: this.sdk,
				styles: {
					input: {
						// change input styles to match
						// bootstrap styles
						"font-size": "1rem",
						color: "#495057",
					},
				},
				fields: {
					number: {
						selector: "#cc-number",
					},
					cardholderName: {
						selector: "#cc-name",
					},
					cvv: {
						selector: "#cc-cvv",
					},
					expirationDate: {
						selector: "#cc-expiration",
						placeholder: "MM/YY",
					},
				},
			});
		if (!this.hostedFieldsInstance) {
			throw new Error("Failed to create Hosted Fields instance.");
		}

		this.hostedFieldsInstance.on("focus", (event: HostedFieldsEvent) => {
			var field: HostedFieldsHostedFieldsFieldData = event.fields[event.emittedBy];
			field.container.classList.add("label-float");
			field.container.classList.remove("filled");
			this.hasComponentRendered = true;
		});

		this.hostedFieldsInstance.on("blur", (event: HostedFieldsEvent) => {
			var field: HostedFieldsHostedFieldsFieldData = event.fields[event.emittedBy];

			if (field.isEmpty) {
				field.container.classList.remove("label-float");
			} else if (field.isValid) {
				field.container.classList.add("filled");
			} else {
				field.container.classList.add("is-invalid");
			}
			this.hasComponentRendered = true;
		});

		this.hostedFieldsInstance.on("empty", (event: HostedFieldsEvent) => {
			var field: HostedFieldsHostedFieldsFieldData = event.fields[event.emittedBy];
			field.container.classList.remove("filled");
			field.container.classList.remove("is-invalid");
			this.hasComponentRendered = true;
		});

		this.hostedFieldsInstance.on("validityChange", (event) => {
			var field = event.fields[event.emittedBy];
			if (field.isValid) {
				field.container.classList.remove("is-invalid");
			} else {
				field.container.classList.add("is-invalid");
			}
			this.hasComponentRendered = true;
		});

		const paymentButton = document.querySelector("#creditCardForm-paymentButton");
		if (this.showPayButton) {
			if (paymentButton instanceof HTMLElement) {
				paymentButton.addEventListener("click", async (e) => {
					e.preventDefault();
					this.hasComponentRendered = true;
					if (await this.isValid()) {
						this.submit();
					} else {
						await this.showValidation();
					}
				});
			}
		}
	}

	async submit() {
		try {
			if (!this.hostedFieldsInstance) {
				throw new Error("Hosted Fields instance is not initialized.");
			}
			if (!this.tokenizedPayload) {
				this.tokenizedPayload = await this.hostedFieldsInstance.tokenize();
			}
		} catch (error) {
			this.onError(error);
			return;
		}

		const request = {
			nonce: this.tokenizedPayload.nonce,
			paymentMethodType: "card",
			paymentReference: this.paymentReference,
		};
		try {
			const response = await fetch(this.processorUrl + "/payment", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Session-Id": this.sessionId,
				},
				body: JSON.stringify(request),
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

			this.onComplete && this.onComplete(paymentResult);
		} catch (error) {
			console.error("Error creating payment");
			this.onError(error);
		} finally {
			await this.hostedFieldsInstance.teardown();
		}
	}

	async showValidation(): Promise<void> {
		if (!this.hasComponentRendered) {
			return;
		}
		if (!this.hostedFieldsInstance) {
			throw new Error("Hosted Fields instance is not initialized.");
		}
		var state: HostedFieldsState = this.hostedFieldsInstance.getState();
		Object.keys(state.fields).forEach((key) => {
			const field = state.fields[key as keyof typeof state.fields];
			if (field.isValid) {
				field.container.classList.add("is-valid");
			} else {
				field.container.classList.add("is-invalid");
			}
		});
	}

	async isValid(): Promise<boolean> {
		if (!this.hasComponentRendered) {
			return Promise.resolve(true);
		}
		if (!this.hostedFieldsInstance) {
			throw new Error("Hosted Fields instance is not initialized.");
		}
		var state: HostedFieldsState = this.hostedFieldsInstance.getState();
		// state fields is an array containing [number, cvv, expirationDate, cardholderName]
		return Object.keys(state.fields).every((key) => state.fields[key as keyof typeof state.fields]?.isValid);
	}

	async getState() {
		if (!this.hostedFieldsInstance) {
			throw new Error("Hosted Fields instance is not initialized.");
		}
		this.tokenizedPayload = await this.hostedFieldsInstance.tokenize();
		const endDigits = this.tokenizedPayload.details?.lastFour || "";

		var result = this.hostedFieldsInstance.getState();
		const state: { card?: { endDigits: string; brand: string } } = {
			card: result.cards[0]
				? {
						endDigits: endDigits,
						brand: this._mapCardBrandType(result.cards[0].type),
					}
				: undefined,
		};
		return state;
	}

	async isAvailable(): Promise<boolean> {
		const client: Client = this.sdk;
		const configuration = client.getConfiguration();
		const cardEnabled = configuration.gatewayConfiguration.creditCards ? true : false;
		return Promise.resolve(cardEnabled);
	}

	private _mapCardBrandType(brand: string): string {
		switch (brand) {
			case "visa":
				return "Visa";
			case "master-card":
				return "Mastercard";
			case "maestro":
				return "Maestro";
			case "american-express":
				return "Amex";
			case "discover":
				return "Discover";
			case "jcb":
				return "Jcb";
			case "diners-club":
				return "Diners";
			case "unionpay":
				return "UnionPay";
			default:
				return "Unknown";
		}
	}

	private _getTemplate() {
		const submitButtonHTML =
			'<button class="btn btn-primary btn-lg" type="submit" id="creditCardForm-paymentButton">Pay with <span id="card-brand">Card</span></button>';
		const payButton = this.showPayButton ? submitButtonHTML : "";
		return `<!-- Bootstrap inspired Braintree Hosted Fields example -->
				<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
				<style>
					.form-control {
						height: calc(1.5em + .75rem + 2px);
					}
						
					body {
						background-color: #fff;
						padding: 15px;
					}

					.toast {
						position: fixed;
						top: 15px;
						right: 15px;
						z-index: 9999;
					}

					.bootstrap-basic {
						background: white;
					}

					/* Braintree Hosted Fields styling classes*/
					.braintree-hosted-fields-focused {
						color: #495057;
						background-color: #fff;
						border-color: #80bdff;
						outline: 0;
						box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
					}

					.braintree-hosted-fields-focused.is-invalid {
						border-color: #dc3545;
						box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
					}


				</style>
				<div class="bootstrap-basic">
				<form class="needs-validation" novalidate="">

					<div class="row">
						<div class="col-sm-12 mb-3">
							<label for="cc-number">Credit card number</label>
							<div class="form-control" id="cc-number"></div>
							<div class="invalid-feedback">
							Credit card number is required
							</div>
						</div>
					</div>

					<div class="row">
						<div class="col-sm-6 mb-3">
							<label for="cc-expiration">Expiration</label>
							<div class="form-control" id="cc-expiration"></div>
							<div class="invalid-feedback">
							Expiration date required
							</div>
						</div>
						<div class="col-sm-6 mb-3">
							<label for="cc-expiration">CVV</label>
							<div class="form-control" id="cc-cvv"></div>
							<div class="invalid-feedback">
							Security code required
							</div>
						</div>
					</div>
					<div class="row">
						<div class="col-sm-12 mb-3">
							<label for="cc-name">Cardholder Name</label>
							<div class="form-control" id="cc-name"></div>
							<small class="text-muted">Full name as displayed on card</small>
							<div class="invalid-feedback">
								Name on card is required
							</div>
						</div>
					</div>

					<hr class="mb-4">
					<div class="text-center col-sm-6">
					${payButton}
					</div>
				</form>
				</div>
				<div aria-live="polite" aria-atomic="true" style="position: relative; min-height: 200px;">
					<small class="text-muted">
					<u>Disclaimer</u><br>We use PayPal for payments and other services. If you wish to use one of these services and pay on our website, PayPal may collect the personal data you provide, such as payment and other identifying information. PayPal uses this information to operate and improve the services it provides to us and others, including for fraud detection, harm and loss prevention, authentication, analytics related to the performance of its services, and to comply with applicable legal requirements. The processing of this information will be subject to PayPal’s privacy policy at <a href="https://www.paypal.com/us/legalhub/privacy-full" target="_app">https://www.paypal.com/us/legalhub/privacy-full</a>.
					</small>
				</div>`;
	}
}
