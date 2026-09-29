/**
 * Represents the interface for a payment component.
 */
export interface PaymentComponent {
	/**
	 * Mounts the payment component to the specified selector.
	 * @param selector - The selector where the component will be mounted.
	 */
	mount(selector: string): void;

	/**
	 * Submits the payment.
	 */
	submit(): void;

	/**
	 * Shows the validation for the payment component.
	 */
	showValidation?(): Promise<void>;

	/**
	 * Checks if the payment component is valid.
	 * @returns A boolean indicating whether the payment component is valid.
	 */
	isValid?(): Promise<boolean>;

	/**
	 * Gets the state of the payment component.
	 * @returns An object representing the state of the payment component.
	 */
	getState?(): Promise<{
		card?: {
			brand: string;
		};
	}>;

	/**
	 * Checks if the payment component is available for use.
	 * @returns A promise that resolves to a boolean indicating whether the payment component is available.
	 */
	isAvailable?(): Promise<boolean>;
}
