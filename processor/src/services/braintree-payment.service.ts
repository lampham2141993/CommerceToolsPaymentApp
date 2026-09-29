import {
	CancelPaymentRequest,
	CapturePaymentRequest,
	ConfigResponse,
	PaymentProviderModificationResponse,
	RefundPaymentRequest,
	ReversePaymentRequest,
	StatusResponse,
} from "./types";

import {
	statusHandler,
	healthCheckCommercetoolsPermissions,
	type TransactionType,
	Errorx,
} from "@commercetools/connect-payments-sdk";

import { AbstractPaymentService } from "././abstract-payment.service";
import { PaymentMethodType, CreatePaymentResponseSchemaDTO } from "../dtos/payment.dto";
import { BraintreePaymentServiceOptions } from "./types/payment.type";
import { BraintreeInitResponse, CreatePaymentRequest } from "./types/payment.type";
import { type ValidatedResponse, type Transaction, TransactionRequest } from "braintree";
import { logger } from "../libs/logger";
import { getConfig } from "../dev-utils/getConfig";
import { PaymentModificationStatus, SupportedPaymentComponentsSchemaDTO } from "../dtos/operation.dto";
import { paymentSDK } from "../sdk/paymentSDK";
import type { AmountSchemaDTO } from "../dtos/operation.dto";
import { ErrorInvalidOperation, TransactionState } from "@commercetools/connect-payments-sdk";
import { mapBraintreeToCtResultCode, mapCtPaymentAmountToBraintreeAmount } from "./mappers/braintree.mapper";
import { mapToBraintreeCreatePaymentRequest } from "./mappers";
import { getCartIdFromContext, getPaymentInterfaceFromContext } from "../libs/fastify/context";
import { BraintreeClient } from "../clients/braintree.client";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const packageJSON = require("../../package.json");

export class BraintreePaymentService extends AbstractPaymentService {
	constructor(opts: BraintreePaymentServiceOptions) {
		super(opts.ctCartService, opts.ctPaymentService);
	}

	/**
	 * Get configurations
	 *
	 * @remarks
	 * Implementation to provide configuration information
	 *
	 * @returns Promise with object containing configuration information
	 */
	public async config(): Promise<ConfigResponse> {
		return {
			environment: getConfig().braintreeEnvironment,
			merchantId: getConfig().braintreeMerchantId,
			merchantAccountId: getConfig().braintreeMerchantAccountId,
			publicKey: getConfig().braintreePublicKey,
		};
	}

	/**
	 * Initialize session
	 *
	 * @remarks
	 * Implementation to initialize Braintree payment session
	 *
	 * @returns Promise returning Braintree client token
	 */
	public async init(): Promise<BraintreeInitResponse> {
		const ctCart = await this.ctCartService.getCart({
			id: getCartIdFromContext(),
		});
		const braintreeClient = BraintreeClient.getInstance();
		const merchantAccountPromise =  braintreeClient.findMerchantAccount(getConfig().braintreeMerchantAccountId);
		const amountPlannedPromise =  this.ctCartService.getPlannedPaymentAmount({ cart: ctCart });
		const [merchantAccount, amountPlanned] = await Promise.all([merchantAccountPromise, amountPlannedPromise]);
		if (merchantAccount?.currencyIsoCode !== amountPlanned.currencyCode) {
			throw new Errorx({
				message: "cart and braintree merchant account currency do not match",
				httpErrorStatus: 400,
				code: "CurrencyNotMatch",
			});
		}

		const ctPayment = await this.ctPaymentService.createPayment({
			amountPlanned,
			paymentMethodInfo: {
				paymentInterface: getPaymentInterfaceFromContext() || "braintree",
			},
			...(ctCart.customerId && {
				customer: {
					typeId: "customer",
					id: ctCart.customerId,
				},
			}),
			...(!ctCart.customerId &&
				ctCart.anonymousId && {
					anonymousId: ctCart.anonymousId,
				}),
		});

		await this.ctCartService.addPayment({
			resource: {
				id: ctCart.id,
				version: ctCart.version,
			},
			paymentId: ctPayment.id,
		});

		const response = await braintreeClient.initiateSession();
		return {
			clientToken: response.clientToken,
			paymentReference: ctPayment.id,
			amount: mapCtPaymentAmountToBraintreeAmount(amountPlanned),
			currencyCode: amountPlanned.currencyCode,
		};
	}

	/**
	 * Get status
	 *
	 * @remarks
	 * Implementation to provide status of external systems including Commercetools and Braintree
	 *
	 * @returns Promise with data containing a list of status from Commercetools and Braintree
	 */
	public async status(): Promise<StatusResponse> {
		const handler = await statusHandler({
			timeout: getConfig().healthCheckTimeout,
			checks: [
				healthCheckCommercetoolsPermissions({
					requiredPermissions: [
						"manage_payments",
						"view_sessions",
						"view_api_clients",
						"manage_orders",
						"introspect_oauth_tokens",
						"manage_checkout_payment_intents",
					],
					ctAuthorizationService: paymentSDK.ctAuthorizationService,
					projectKey: getConfig().projectKey,
				}),
				async () => {
					try {
						const braintreeClient = BraintreeClient.getInstance();
						const result = await braintreeClient.healthCheck();
						logger.info(result);
						return {
							name: "Braintree status check",
							status: "UP",
							details: {
								paymentMethods: [PaymentMethodType.CARD, PaymentMethodType.PAYPAL],
							},
							message: "Braintree API is reachable",
						};
					} catch (e) {
						return {
							name: "Braintree status check",
							status: "DOWN",
							message: `Not able to talk to the Braintree API`,
							details: {
								error: e,
							},
						};
					}
				},
			],
			metadataFn: async () => ({
				name: packageJSON.name,
				description: packageJSON.description,
				"@commercetools/connect-payments-sdk": packageJSON.dependencies["@commercetools/connect-payments-sdk"],
				braintree: packageJSON.dependencies["braintree"],
			}),
			log: logger,
		})();

		return handler.body;
	}

	/**
	 * Get supported payment components
	 *
	 * @remarks
	 * Implementation to provide the payment components supported by the processor.
	 *
	 * @returns Promise with data containing a list of supported payment components
	 */
	public async getSupportedPaymentComponents(): Promise<SupportedPaymentComponentsSchemaDTO> {
		return {
			dropins: [],
			components: [
				{
					type: PaymentMethodType.CARD,
				},
				{
					type: PaymentMethodType.PAYPAL,
				},
			],
		};
	}

	/**
	 * Create payment
	 *
	 * @remarks
	 * Implementation to provide the mocking data for payment creation in external PSPs
	 *
	 * @param request - contains paymentType defined in composable commerce
	 * @returns Promise with mocking data containing operation status and PSP reference
	 */
	public async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponseSchemaDTO> {
		let ctCart = await this.ctCartService.getCart({ id: getCartIdFromContext() });
		const amountPlanned = await this.ctCartService.getPaymentAmount({ cart: ctCart });
		const braintreeClient = BraintreeClient.getInstance();
		const merchantAccount = await braintreeClient.findMerchantAccount(getConfig().braintreeMerchantAccountId);

		if (merchantAccount?.currencyIsoCode !== amountPlanned.currencyCode) {
			throw new Errorx({
				message: "cart and braintree merchant account currency do not match",
				httpErrorStatus: 400,
				code: "CurrencyNotMatch",
			});
		}
		let ctPayment = request.data.paymentReference
			? await this.ctPaymentService.updatePayment({
					id: request.data.paymentReference,
					paymentMethod: request.data.paymentMethodType,
				})
			: undefined;

		// If there's a payment reference
		if (ctPayment) {
			if (await this.hasPaymentAmountChanged(ctCart, ctPayment)) {
				throw new ErrorInvalidOperation(
					"The payment amount does not fulfill the remaining amount of the cart",
					{
						fields: {
							cartId: ctCart.id,
							paymentId: ctPayment.id,
						},
					},
				);
			}
		} else {
			// Else no payment reference
			ctPayment = await this.ctPaymentService.createPayment({
				amountPlanned,
				paymentMethodInfo: {
					paymentInterface: getPaymentInterfaceFromContext() || "braintree",
					method: request.data.paymentMethodType,
				},
				...(ctCart.customerId && {
					customer: {
						typeId: "customer",
						id: ctCart.customerId,
					},
				}),
				...(!ctCart.customerId &&
					ctCart.anonymousId && {
						anonymousId: ctCart.anonymousId,
					}),
			});
			ctCart = await this.ctCartService.addPayment({
				resource: {
					id: ctCart.id,
					version: ctCart.version,
				},
				paymentId: ctPayment.id,
			});
		}

		const txnReq: TransactionRequest = mapToBraintreeCreatePaymentRequest(ctCart, request.data.nonce);

		let btResponse = await BraintreeClient.getInstance().createPayment(txnReq);

		const expectedInstrument =
			request.data.paymentMethodType === PaymentMethodType.PAYPAL ? "paypal_account" : "credit_card";
		const actualInstrument = btResponse.transaction.paymentInstrumentType;
		if (actualInstrument && actualInstrument !== expectedInstrument) {
			await BraintreeClient.getInstance().cancelPayment(btResponse.transaction.id);
			await this.ctPaymentService.updatePayment({
				id: ctPayment.id,
				pspReference: btResponse.transaction.id,
				transaction: {
					type: "Authorization",
					amount: ctPayment.amountPlanned,
					interactionId: btResponse.transaction.id,
					state: "Failure",
				},
			});
			return {
				id: btResponse.transaction.id,
				success: false,
				status: "voided",
				amount: btResponse.transaction.amount,
				paymentReference: ctPayment.id,
				message: `Expected ${request.data.paymentMethodType} but Braintree returned ${actualInstrument}`,
			};
		}

		const txState: TransactionState = mapBraintreeToCtResultCode(btResponse.transaction.status, btResponse.success);
		const updatedPayment = await this.ctPaymentService.updatePayment({
			id: ctPayment.id,
			pspReference: btResponse.transaction.id,
			transaction: {
				type: "Authorization",
				amount: ctPayment.amountPlanned,
				interactionId: btResponse.transaction.id,
				state: txState,
			},
		});

		logger.info(`Payment authorization processed.`, {
			paymentId: updatedPayment.id,
			interactionId: btResponse.transaction.id,
			result: btResponse.success,
			status: btResponse.transaction.status,
		});

		return {
			id: btResponse.transaction.id,
			success: btResponse.success,
			status: btResponse.transaction.status,
			additionalProcessorResponse: btResponse.transaction.additionalProcessorResponse ?? undefined,
			amount: btResponse.transaction.amount,
			paymentReference: updatedPayment.id,
			message: btResponse.message ?? undefined,
		};
	}

	async capturePayment(capturePaymentRequest: CapturePaymentRequest): Promise<PaymentProviderModificationResponse> {
		const action = "capturePayment";
		const transactionType = this.getPaymentTransactionType(action);
		logger.info(`Processing payment modification.`, {
			paymentId: capturePaymentRequest.payment.id,
			action,
		});

		const response = await this.processPaymentModificationInternal({
			request: capturePaymentRequest,
			transactionType,
			braintreeOperation: "capture",
			amount: capturePaymentRequest.amount,
		});

		logger.info(`Payment modification completed.`, {
			paymentId: capturePaymentRequest.payment.id,
			action: "capturePayment",
			result: response.outcome,
		});

		return {
			outcome: response.outcome,
			pspReference: response.pspReference,
		};
	}

	async cancelPayment(cancelPaymentRequest: CancelPaymentRequest): Promise<PaymentProviderModificationResponse> {
		const action = "cancelPayment";
		const transactionType = this.getPaymentTransactionType(action);
		logger.info(`Processing payment modification.`, {
			paymentId: cancelPaymentRequest.payment.id,
			action,
		});

		const response = await this.processPaymentModificationInternal({
			request: cancelPaymentRequest,
			transactionType,
			braintreeOperation: "cancel",
			amount: cancelPaymentRequest.payment.amountPlanned,
		});

		logger.info(`Payment modification completed.`, {
			paymentId: cancelPaymentRequest.payment.id,
			action,
			result: response.outcome,
		});
		return {
			outcome: response.outcome,
			pspReference: response.pspReference,
		};
	}

	async refundPayment(request: RefundPaymentRequest): Promise<PaymentProviderModificationResponse> {
		const action = "refundPayment";
		logger.info(`Processing payment modification.`, {
			paymentId: request.payment.id,
			action,
		});

		const response = await this.processPaymentModificationInternal({
			request,
			transactionType: "Refund",
			braintreeOperation: "refund",
			amount: request.amount,
		});

		logger.info(`Payment modification completed.`, {
			paymentId: request.payment.id,
			action,
			result: response.outcome,
		});

		return response;
	}

	async reversePayment(request: ReversePaymentRequest): Promise<PaymentProviderModificationResponse> {
		logger.info(`Processing payment modification.`, {
			paymentId: request.payment.id,
			action: "reversePayment",
		});

		const transactionStateChecker = (transactionType: TransactionType, states: TransactionState[]) =>
			this.ctPaymentService.hasTransactionInState({ payment: request.payment, transactionType, states });

		const hasCharge = transactionStateChecker("Charge", ["Success"]);
		const hasAuthorization = transactionStateChecker("Authorization", ["Success"]);

		let response!: PaymentProviderModificationResponse;
		if (hasCharge) {
			response = await this.processPaymentModificationInternal({
				request,
				transactionType: "Refund",
				braintreeOperation: "reverse",
				amount: request.payment.amountPlanned,
			});
		} else if (hasAuthorization) {
			response = await this.processPaymentModificationInternal({
				request,
				transactionType: "CancelAuthorization",
				braintreeOperation: "reverse",
				amount: request.payment.amountPlanned,
			});
		} else {
			throw new ErrorInvalidOperation(`There is no successful payment transaction to reverse.`);
		}

		logger.info(`Payment modification completed.`, {
			paymentId: request.payment.id,
			action: "reversePayment",
			result: response.outcome,
		});

		return response;
	}

	// @ts-expect-error - unused parameter
	private validatePaymentMethod(request: CreatePaymentRequest): void {
		throw new Error("Not yet implemented");
	}

	private async makeCallToBraintreeInternal(
		interfaceId: string,
		transactionType: TransactionType,
		braintreeOperation: "capture" | "refund" | "cancel" | "reverse",
		request: CapturePaymentRequest | CancelPaymentRequest | RefundPaymentRequest,
	): Promise<ValidatedResponse<Transaction>> {
		switch (braintreeOperation) {
			case "capture": {
				const braintreeClient = BraintreeClient.getInstance();
				const centAmount = (request as RefundPaymentRequest).amount?.centAmount;
				const fractionDigits = (request as RefundPaymentRequest).amount?.fractionDigits;
				const amount = (centAmount / Math.pow(10, fractionDigits)).toFixed(fractionDigits);
				return await braintreeClient.capturePayment(interfaceId, amount);
			}
			case "refund": {
				const braintreeClient = BraintreeClient.getInstance();
				const centAmount = (request as RefundPaymentRequest).amount?.centAmount;
				const fractionDigits = (request as RefundPaymentRequest).amount?.fractionDigits;
				const amount = (centAmount / Math.pow(10, fractionDigits)).toFixed(fractionDigits);
				return await braintreeClient.refundPayment(interfaceId, amount);
			}
			case "cancel": {
				const braintreeClient = BraintreeClient.getInstance();
				return await braintreeClient.cancelPayment(interfaceId);
			}
			case "reverse": {
				if (transactionType === "CancelAuthorization") {
					const braintreeClient = BraintreeClient.getInstance();
					return await braintreeClient.cancelPayment(interfaceId);
				} else {
					// transactionType === "Charge"
					const braintreeClient = BraintreeClient.getInstance();
					const centAmount = (request as RefundPaymentRequest).amount?.centAmount;
					const fractionDigits = (request as RefundPaymentRequest).amount?.fractionDigits;
					const amount = (centAmount / Math.pow(10, fractionDigits)).toFixed(fractionDigits);
					return await braintreeClient.refundPayment(interfaceId, amount);
				}
			}
			default: {
				logger.error(
					`makeCallToBraintreeInternal: Operation ${braintreeOperation} not supported when modifying payment.`,
				);
				throw new ErrorInvalidOperation(`Operation not supported.`);
			}
		}
	}

	private async processPaymentModificationInternal(opts: {
		request: CapturePaymentRequest | CancelPaymentRequest | RefundPaymentRequest | ReversePaymentRequest;
		transactionType: "Charge" | "Refund" | "CancelAuthorization";
		braintreeOperation: "capture" | "refund" | "cancel" | "reverse";
		amount: AmountSchemaDTO;
	}): Promise<PaymentProviderModificationResponse> {
		const { request, transactionType, braintreeOperation, amount } = opts;
		await this.ctPaymentService.updatePayment({
			id: request.payment.id,
			transaction: {
				type: transactionType,
				amount,
				state: "Initial",
			},
		});

		const interfaceId = request.payment.interfaceId as string;
		const response = await this.makeCallToBraintreeInternal(
			interfaceId,
			transactionType,
			braintreeOperation,
			request,
		);

		await this.ctPaymentService.updatePayment({
			id: request.payment.id,
			transaction: {
				type: transactionType,
				amount,
				interactionId: response.transaction.id,
				state: this.convertPaymentModificationOutcomeToState(
					response.success ? PaymentModificationStatus.APPROVED : PaymentModificationStatus.REJECTED,
				),
			},
		});
		const outcome = response.success ? PaymentModificationStatus.APPROVED : PaymentModificationStatus.REJECTED;
		return { outcome, pspReference: response.transaction.id };
	}
}
