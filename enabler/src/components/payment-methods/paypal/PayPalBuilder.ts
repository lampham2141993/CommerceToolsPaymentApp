import {
	type BaseOptions,
	type ComponentOptions,
	type PaymentComponent,
	type PaymentComponentBuilder,
} from "../../../payment-enabler";
import { PayPal } from "./PayPal";

export class PayPalBuilder implements PaymentComponentBuilder {
	public componentHasSubmit = false;

	constructor(private baseOptions: BaseOptions) {}

	build(config: ComponentOptions): PaymentComponent {
		return new PayPal(this.baseOptions, config);
	}
}
