import {
	type BaseOptions,
	type ComponentOptions,
	type PaymentComponent,
	PaymentMethod,
	type PaymentResult,
} from "../payment-enabler";

import type { Client } from "braintree-web";

export type ElementOptions = {
	paymentMethod: PaymentMethod;
};

/**
 * Base Web Component
 */
export abstract class BaseComponent implements PaymentComponent {
	protected paymentMethod: ElementOptions["paymentMethod"];
	protected sdk: Client;
	protected processorUrl: BaseOptions["processorUrl"];
	protected sessionId: BaseOptions["sessionId"];
	protected paymentReference?: BaseOptions["paymentReference"];
	protected onComplete: (result: PaymentResult) => void;
	protected onError: (error?: any) => void;

	constructor(paymentMethod: PaymentMethod, baseOptions: BaseOptions, _componentOptions: ComponentOptions) {
		this.paymentMethod = paymentMethod;
		this.sdk = baseOptions.sdk;
		this.processorUrl = baseOptions.processorUrl;
		this.sessionId = baseOptions.sessionId;
		this.paymentReference = baseOptions.paymentReference;
		this.onComplete = baseOptions.onComplete;
		this.onError = baseOptions.onError;
	}

	abstract submit(): void;

	abstract mount(selector: string): void;
}
