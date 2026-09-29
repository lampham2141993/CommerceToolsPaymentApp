import { paymentSDK } from "../sdk/paymentSDK";
import { BraintreePaymentService } from "../services/braintree-payment.service";

const paymentService = new BraintreePaymentService({
	ctCartService: paymentSDK.ctCartService,
	ctPaymentService: paymentSDK.ctPaymentService,
});

export const app = {
	services: {
		paymentService,
	},
};
