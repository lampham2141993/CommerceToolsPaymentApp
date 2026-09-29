export type BasePaymentSdkOptions = { environment: string };

/**
 * Represents a fake SDK.
 */
export abstract class BasePaymentSdk {
	protected environment: string;

	/**
	 * Creates an instance of FakeSdk.
	 * @param environment - The environment for the SDK.
	 */
	constructor({ environment }: BasePaymentSdkOptions) {
		this.environment = environment;
	}

	/**
	 * Initializes the SDK with the specified options.
	 * @param opts - The options for initializing the SDK.
	 */
	abstract init(opts: any): void;
}
