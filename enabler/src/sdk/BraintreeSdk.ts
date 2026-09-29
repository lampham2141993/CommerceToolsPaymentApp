import { BasePaymentSdk, type BasePaymentSdkOptions } from "./BasePaymentSdk";

/**
 * Represents a Braintree SDK.
 */
export class BraintreeSdk extends BasePaymentSdk {
	/**
	 * Creates an instance of BraintreeSdk.
	 * @param environment - The environment for the SDK.
	 */
	constructor(options: BasePaymentSdkOptions) {
		super(options);
		console.log("BraintreeSdk constructor", this.environment);
	}

	/**
	 * Initializes the SDK with the specified options.
	 * @param opts - The options for initializing the SDK.
	 */
	init(opts: any) {
		console.log("BraintreeSdk init", opts);
	}
}
