import { FastifyInstance } from "fastify";
import { paymentSDK } from "../../sdk/paymentSDK";
import { braintreePaymentRoutes } from "../../routes/braintree-payment.route";
import { BraintreePaymentService } from "../../services/braintree-payment.service";

export default async function (server: FastifyInstance) {
	const braintreePaymentService = new BraintreePaymentService({
		ctCartService: paymentSDK.ctCartService,
		ctPaymentService: paymentSDK.ctPaymentService,
	});

	await server.register(braintreePaymentRoutes, {
		paymentService: braintreePaymentService,
		sessionHeaderAuthHook: paymentSDK.sessionHeaderAuthHookFn,
	});
}
