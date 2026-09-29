import braintree, {
	type ClientToken,
	type MerchantAccount,
	type Transaction,
	type TransactionRequest,
	type ValidatedResponse,
} from "braintree";
import { getConfig } from "../dev-utils/getConfig";
import { logger } from "../libs/logger";
import { BraintreeApiError, BraintreeApiErrorData } from "../errors/braintree-api.error";
import { ErrorGeneral } from "@commercetools/connect-payments-sdk";

/**
 * Find customer
 *
 * @remarks
 * Implementation to find a Braintree customer by ID
 *
 * @param customerId - the ID of the customer to be found
 * @returns Promise with Braintree customer with specified ID
 */
export class BraintreeClient {
	private braintreeGateway: braintree.BraintreeGateway;
	private static instance: BraintreeClient;
	private static readonly BNCode = "commercetools_BT_XO_CT"; // Braintree channel code for Commercetools
	private constructor() {
		const config = getConfig();
		this.braintreeGateway = new braintree.BraintreeGateway({
			environment:
				config.braintreeEnvironment.toLowerCase() === "production"
					? braintree.Environment.Production
					: braintree.Environment.Sandbox,
			merchantId: config.braintreeMerchantId,
			publicKey: config.braintreePublicKey,
			privateKey: config.braintreePrivateKey,
		});
	}

	public static getInstance(): BraintreeClient {
		if (!BraintreeClient.instance) {
			BraintreeClient.instance = new BraintreeClient();
		}
		return BraintreeClient.instance;
	}

	public async findMerchantAccount(merchantAccountId: string): Promise<MerchantAccount | undefined> {
		try {
			return await this.braintreeGateway.merchantAccount.find(merchantAccountId);
		} catch (e) {
			logger.error(`Error finding Braintree merchant account [${merchantAccountId}].`, {
				error: e,
			});
			this.handleError(e, "Error finding Braintree merchant account.");
		}
	}

	public async healthCheck(): Promise<MerchantAccount[]> {
		try {
			const result = await this.braintreeGateway.merchantAccount.all();
			logger.info("Connect to Braintree platform successfully.");
			return result;
		} catch (e) {
			logger.error("Braintree health check failed.", e);
			this.handleError(e, "Error communicating with Braintree platform.");
		}
	}

	public async initiateSession(): Promise<ValidatedResponse<ClientToken>> {
		try {
			const response = await this.braintreeGateway.clientToken.generate({});
			return response;
		} catch (e: any) {
			logger.error(`Error generating Braintree client token.`, {
				error: e,
			});
			this.handleError(e, "Error generating Braintree client token.");
		}
	}

	public async createPayment(request: TransactionRequest): Promise<ValidatedResponse<Transaction>> {
		let btResponse: braintree.ValidatedResponse<braintree.Transaction>;
		try {
			const requestWithChannel: TransactionRequest = {
				...request,
				channel: BraintreeClient.BNCode,
			};
			btResponse = await this.braintreeGateway.transaction.sale(requestWithChannel);

			// If the transaction is not present, it means no transaction status is returned and no transaction will be saved to CoCo
			if (!btResponse.success && !btResponse.transaction) {
				const errorData = {
					status: 500,
					name: "TransactionError",
					type: "TransactionError",
					message: btResponse.message,
				};
				throw new BraintreeApiError(errorData, {
					privateMessage: btResponse.message,
					cause: btResponse.errors ? btResponse.errors : undefined,
				});
			}
			return btResponse; // if it is not successful but transaction exists, it will be save to CoCo as failed transaction in CoCo payment
		} catch (e: any) {
			logger.error(`Error creating Braintree transaction.`, {
				error: e,
			});
			this.handleError(e, "Error creating Braintree transaction.");
		}
	}

	public async refundPayment(interactionId: string, amount?: string): Promise<ValidatedResponse<Transaction>> {
		try {
			const refundResult: ValidatedResponse<Transaction> = await this.braintreeGateway.transaction.refund(
				interactionId,
				amount,
			);
			if (!refundResult.success && !refundResult.transaction) {
				const errorData = {
					status: 500,
					name: "TransactionError",
					type: "TransactionError",
				};
				throw new BraintreeApiError(errorData, {
					privateMessage: refundResult.message,
					cause: refundResult.errors ? refundResult.errors : undefined,
				});
			}
			return refundResult;
		} catch (e: any) {
			logger.error(`Error processing Braintree refund payment for transaction [${interactionId}].`, {
				error: e,
			});
			this.handleError(e, "Error refund Braintree transaction.");
		}
	}

	public async cancelPayment(interactionId: string): Promise<ValidatedResponse<Transaction>> {
		try {
			const cancelResult: ValidatedResponse<Transaction> =
				await this.braintreeGateway.transaction.void(interactionId);
			if (!cancelResult.success && !cancelResult.transaction) {
				const errorData = {
					status: 500,
					name: "TransactionError",
					type: "TransactionError",
				};
				throw new BraintreeApiError(errorData, {
					privateMessage: cancelResult.message,
					cause: cancelResult.errors ? cancelResult.errors : undefined,
				});
			}
			return cancelResult;
		} catch (e: any) {
			logger.error(`Error processing Braintree cancel payment for transaction [${interactionId}].`, {
				error: e,
			});
			this.handleError(e, "Error cancel Braintree transaction.");
		}
	}

	public async capturePayment(interactionId: string, amount?: string): Promise<ValidatedResponse<Transaction>> {
		try {
			const captureResult: ValidatedResponse<Transaction> =
				await this.braintreeGateway.transaction.submitForSettlement(interactionId, amount);
			if (!captureResult.success && !captureResult.transaction) {
				const errorData = {
					status: 500,
					name: "TransactionError",
					type: "TransactionError",
				};
				throw new BraintreeApiError(errorData, {
					privateMessage: captureResult.message,
					cause: captureResult.errors ? captureResult.errors : undefined,
				});
			}
			return captureResult;
		} catch (e: any) {
			logger.error(`Error processing Braintree capture payment for transaction [${interactionId}].`, {
				error: e,
			});
			this.handleError(e, "Error capture Braintree transaction.");
		}
	}
	private handleError(e: any, privateMessage: string): never {
		if (e instanceof BraintreeApiError) {
			throw e; // Re-throw BraintreeApiError if already created
		} else if (e.name && e.type) {
			const errorData: BraintreeApiErrorData = {
				status: 500,
				name: e.name,
				type: e.type,
			};
			throw new BraintreeApiError(errorData, {
				privateMessage,
				cause: e,
			});
		}
		throw new ErrorGeneral(undefined, {
			privateMessage: "Failed due to network error or internal computations",
			cause: e,
		});
	}
}
