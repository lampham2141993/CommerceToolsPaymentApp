import { createApplicationLogger } from "@commercetools-backend/loggers";
import { defaultFieldsFormatter } from "@commercetools/connect-payments-sdk";
import { getRequestContext } from "../fastify/context";
import { getConfig } from "../../dev-utils/getConfig";

export const logger = createApplicationLogger({
	formatters: [
		defaultFieldsFormatter({
			projectKey: getConfig().projectKey,
			version: process.env.npm_package_version,
			name: process.env.npm_package_name,
			correlationId: () => getRequestContext().correlationId,
			pathTemplate: () => getRequestContext().pathTemplate,
			path: () => getRequestContext().path,
		}),
	],
});
