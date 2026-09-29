import { type ComponentOptions } from "./ComponentOptions";
import { type PaymentComponent } from "./PaymentComponent";

/**
 * Represents the interface for a payment component builder.
 */
export interface PaymentComponentBuilder {
	/**
	 * Indicates whether the component has a submit action.
	 */
	componentHasSubmit?: boolean;

	/**
	 * Builds a payment component with the specified configuration.
	 * @param config - The configuration options for the payment component.
	 * @returns The built payment component.
	 */
	build(config: ComponentOptions): PaymentComponent;
}
