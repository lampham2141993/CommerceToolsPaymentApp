import { RequestContextData, setupPaymentSDK, Logger } from "@commercetools/connect-payments-sdk";
import { getConfig } from "../dev-utils/getConfig";
import { getRequestContext, updateRequestContext } from "../libs/fastify/context";
import { logger } from "../libs/logger";

const config = getConfig();

export class AppLogger implements Logger {
	public debug = (obj: object, message: string) => {
		logger.debug(message, obj || undefined);
	};
	public info = (obj: object, message: string) => {
		logger.info(message, obj || undefined);
	};
	public warn = (obj: object, message: string) => {
		logger.warn(message, obj || undefined);
	};
	public error = (obj: object, message: string) => {
		logger.error(message, obj || undefined);
	};
}

export const appLogger = new AppLogger();

export const paymentSDK = setupPaymentSDK({
	apiUrl: config.apiUrl,
	authUrl: config.authUrl,
	clientId: config.clientId,
	clientSecret: config.clientSecret,
	projectKey: config.projectKey,
	sessionUrl: config.sessionUrl,
	jwksUrl: config.jwksUrl,
	jwtIssuer: config.jwtIssuer,
	getContextFn: (): RequestContextData => {
		const { correlationId, requestId, authentication } = getRequestContext();
		return {
			correlationId: correlationId || "",
			requestId: requestId || "",
			authentication,
		};
	},
	updateContextFn: (context: Partial<RequestContextData>) => {
		const requestContext = Object.assign(
			{},
			context.correlationId ? { correlationId: context.correlationId } : {},
			context.requestId ? { requestId: context.requestId } : {},
			context.authentication ? { authentication: context.authentication } : {},
		);
		updateRequestContext(requestContext);
	},
	logger: appLogger,
});
