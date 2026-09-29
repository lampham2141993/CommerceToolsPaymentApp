import { FastifyInstance } from "fastify";
import { paymentSDK } from "../../sdk/paymentSDK";
import { operationsRoutes } from "../../routes/operations.route";
import { app } from "../app";

export default async function (server: FastifyInstance) {
	await server.register(operationsRoutes, {
		prefix: "/operations",
		paymentService: app.services.paymentService,
		jwtAuthHook: paymentSDK.jwtAuthHookFn,
		oauth2AuthHook: paymentSDK.oauth2AuthHookFn,
		sessionHeaderAuthHook: paymentSDK.sessionHeaderAuthHookFn,
		authorizationHook: paymentSDK.authorityAuthorizationHookFn,
	});
}
