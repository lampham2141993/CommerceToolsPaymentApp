/**
 * Represents the options for a payment component.
 */
export type ComponentOptions = {
	/**
	 * Indicates whether to show the pay button.
	 */
	showPayButton?: boolean;

	/**
	 * A callback function that is called when the pay button is clicked.
	 * @returns A Promise indicating whether the payment should proceed.
	 */
	onPayButtonClick?: () => Promise<void>;
};
