import { describe, test, expect, afterEach, jest, beforeEach } from "@jest/globals";
import { ConfigResponse, ModifyPayment, StatusResponse } from "../../src/services/types";
import { paymentSDK } from "../../src/sdk/paymentSDK";
import { DefaultPaymentService } from "@commercetools/connect-payments-sdk/dist/commercetools/services/ct-payment.service";

import { BraintreeClient } from "../../src/clients";

import {
	mockGetPaymentResult,
	mockUpdatePaymentResult,
	mockBraintreeRefundPaymentResponse,
	mockBraintreeVoidPaymentResponse,
	mockBrainTreeCapturePaymentResponse,
	mockGetPaymentResultWithAuthorizedTxn,
	mockBrainTreeCreatePaymentResponse,
} from "../utils/mock-payment-results";
import { mockGetCartResult } from "../utils/mock-cart-data";
import { mockBraintreeMerchantAccount } from "../utils/mock-merchant-account-data";
import * as Config from "../../src/dev-utils/getConfig";

import { CreatePaymentRequest, BraintreePaymentServiceOptions } from "../../src/services/types/payment.type";
import { AbstractPaymentService } from "../../src/services/abstract-payment.service";
import { BraintreePaymentService } from "../../src/services/braintree-payment.service";
import { PaymentMethodType } from "../../src/dtos/payment.dto";
import * as StatusHandler from "@commercetools/connect-payments-sdk/dist/api/handlers/status.handler";

import { Errorx, HealthCheckResult } from "@commercetools/connect-payments-sdk";

interface FlexibleConfig {
	[key: string]: string; // Adjust the type according to your config values
}

function setupMockConfig(keysAndValues: Record<string, string>) {
	const mockConfig: FlexibleConfig = {};
	Object.keys(keysAndValues).forEach((key) => {
		mockConfig[key] = keysAndValues[key] as string;
	});
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	jest.spyOn(Config, "getConfig").mockReturnValue(mockConfig as any);
}

describe(BraintreePaymentService.name, () => {
	const opts: BraintreePaymentServiceOptions = {
		ctCartService: paymentSDK.ctCartService,
		ctPaymentService: paymentSDK.ctPaymentService,
	};
	const paymentService: AbstractPaymentService = new BraintreePaymentService(opts);
	// const mockPaymentService: BraintreePaymentService = new BraintreePaymentService(opts);

	beforeEach(() => {
		jest.setTimeout(10000);
		jest.resetAllMocks();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	test("getConfig", async () => {
		setupMockConfig({ braintreeMerchantId: "test-merchant-id", braintreeEnvironment: "test" });
		const result: ConfigResponse = await paymentService.config();
		// Assertions can remain the same or be adapted based on the abstracted access
		expect(result?.merchantId).toStrictEqual("test-merchant-id");
		expect(result?.environment).toStrictEqual("test");
	});

	test("getSupportedPaymentComponents", async () => {
		const result: ConfigResponse = await paymentService.getSupportedPaymentComponents();
		expect(result?.components).toHaveLength(2);
		expect(result?.components.map((component) => component.type)).toStrictEqual(["card", "paypal"]);
		expect(result?.dropins).toHaveLength(0);
	});

	test("getStatus", async () => {
		const mockHealthCheckFunction: () => Promise<HealthCheckResult> = async () => {
			const result: HealthCheckResult = {
				name: "CoCo Permissions",
				status: "DOWN",
				message: "CoCo Permissions are not available",
				details: {},
			};
			return result;
		};
		jest.spyOn(StatusHandler, "healthCheckCommercetoolsPermissions").mockReturnValue(mockHealthCheckFunction);
		const paymentService: AbstractPaymentService = new BraintreePaymentService(opts);
		const result: StatusResponse = await paymentService.status();
		expect(result?.status).toBeDefined();
		expect(result?.checks).toHaveLength(2);
		expect(result?.status).toStrictEqual("Partially Available");
		expect(result?.checks[0]?.name).toStrictEqual("CoCo Permissions");
		expect(result?.checks[0]?.status).toStrictEqual("DOWN");
		expect(result?.checks[0]?.details).toStrictEqual({});
		expect(result?.checks[0]?.message).toBeDefined();
		expect(result?.checks[1]?.name).toStrictEqual("Braintree status check");
		expect(result?.checks[1]?.status).toStrictEqual("UP");
		expect(result?.checks[1]?.details).toBeDefined();
		expect(result?.checks[1]?.message).toBeDefined();
	});

	test("cancelPayment", async () => {
		const modifyPaymentOpts: ModifyPayment = {
			paymentId: "dummy-paymentId",
			data: {
				actions: [
					{
						action: "cancelPayment",
					},
				],
			},
		};

		jest.spyOn(DefaultPaymentService.prototype, "getPayment").mockResolvedValue(mockGetPaymentResult);
		jest.spyOn(DefaultPaymentService.prototype, "updatePayment").mockResolvedValue(mockUpdatePaymentResult);
		jest.spyOn(DefaultPaymentService.prototype, "updatePayment").mockResolvedValue(mockUpdatePaymentResult);
		jest.spyOn(BraintreeClient.prototype, "cancelPayment").mockResolvedValue(mockBraintreeVoidPaymentResponse);

		const result = await paymentService.modifyPayment(modifyPaymentOpts);
		expect(result?.outcome).toStrictEqual("approved");
		expect(result?.pspReference).toStrictEqual("dummy-braintree-transaction-id");
	});

	test("capturePayment", async () => {
		const modifyPaymentOpts: ModifyPayment = {
			paymentId: "dummy-paymentId",
			data: {
				actions: [
					{
						action: "capturePayment",
						amount: {
							centAmount: 150000,
							currencyCode: "USD",
						},
					},
				],
			},
		};

		jest.spyOn(DefaultPaymentService.prototype, "getPayment").mockResolvedValue(mockGetPaymentResult);
		jest.spyOn(DefaultPaymentService.prototype, "updatePayment").mockResolvedValue(mockUpdatePaymentResult);
		jest.spyOn(DefaultPaymentService.prototype, "updatePayment").mockResolvedValue(mockUpdatePaymentResult);
		jest.spyOn(BraintreeClient.prototype, "capturePayment").mockResolvedValue(mockBrainTreeCapturePaymentResponse);

		const result = await paymentService.modifyPayment(modifyPaymentOpts);
		expect(result?.outcome).toStrictEqual("approved");
		expect(result?.pspReference).toStrictEqual("dummy-braintree-transaction-id");
	});

	test("refundPayment", async () => {
		const modifyPaymentOpts: ModifyPayment = {
			paymentId: "dummy-paymentId",
			data: {
				actions: [
					{
						action: "refundPayment",
						amount: {
							centAmount: 150000,
							currencyCode: "USD",
						},
					},
				],
			},
		};

		jest.spyOn(DefaultPaymentService.prototype, "getPayment").mockResolvedValue(mockGetPaymentResult);
		jest.spyOn(DefaultPaymentService.prototype, "updatePayment").mockResolvedValue(mockUpdatePaymentResult);
		jest.spyOn(DefaultPaymentService.prototype, "updatePayment").mockResolvedValue(mockUpdatePaymentResult);
		jest.spyOn(BraintreeClient.prototype, "refundPayment").mockResolvedValue(mockBraintreeRefundPaymentResponse);

		const result = await paymentService.modifyPayment(modifyPaymentOpts);
		expect(result?.outcome).toStrictEqual("approved");
		expect(result?.pspReference).toStrictEqual("dummy-braintree-transaction-id");
	});

	test("reversePayment with authorized transaction", async () => {
		const modifyPaymentOpts: ModifyPayment = {
			paymentId: "dummy-paymentId",
			data: {
				actions: [
					{
						action: "reversePayment",
						amount: {
							centAmount: 150000,
							currencyCode: "USD",
						},
					},
				],
			},
		};

		jest.spyOn(DefaultPaymentService.prototype, "getPayment").mockResolvedValue(
			mockGetPaymentResultWithAuthorizedTxn,
		);
		jest.spyOn(DefaultPaymentService.prototype, "hasTransactionInState").mockReturnValueOnce(false);
		jest.spyOn(DefaultPaymentService.prototype, "hasTransactionInState").mockReturnValueOnce(true);

		jest.spyOn(DefaultPaymentService.prototype, "updatePayment").mockResolvedValue(mockUpdatePaymentResult);
		jest.spyOn(DefaultPaymentService.prototype, "updatePayment").mockResolvedValue(mockUpdatePaymentResult);
		jest.spyOn(BraintreeClient.prototype, "cancelPayment").mockResolvedValue(mockBraintreeVoidPaymentResponse);

		const result = await paymentService.modifyPayment(modifyPaymentOpts);
		expect(result?.outcome).toStrictEqual("approved");
		expect(result?.pspReference).toStrictEqual("dummy-braintree-transaction-id");
	});

	test("create card payment", async () => {
		const mockCart = mockGetCartResult();
		const mockPayment = { ...mockGetPaymentResult, amountPlanned: mockCart.totalPrice };
		const mockUpdatedPayment = { ...mockUpdatePaymentResult, amountPlanned: mockCart.totalPrice };
		const mockBraintreeResponse = mockBrainTreeCreatePaymentResponse;

		jest.spyOn(paymentSDK.ctCartService, "getCart").mockResolvedValue(mockCart);
		jest.spyOn(paymentSDK.ctCartService, "getPaymentAmount").mockResolvedValue(mockCart.totalPrice);
		jest.spyOn(paymentSDK.ctCartService, "addPayment").mockResolvedValue(mockCart);
		jest.spyOn(paymentSDK.ctPaymentService, "createPayment").mockResolvedValue(mockPayment);
		jest.spyOn(paymentSDK.ctPaymentService, "updatePayment").mockResolvedValue(mockUpdatedPayment);
		jest.spyOn(BraintreeClient.prototype, "createPayment").mockResolvedValue(mockBraintreeResponse);
		jest.spyOn(BraintreeClient.prototype, "findMerchantAccount").mockResolvedValue(mockBraintreeMerchantAccount);
		const createPaymentRequest: CreatePaymentRequest = {
			data: {
				nonce: "dummy-nonce",
				paymentMethodType: PaymentMethodType.CARD,
			},
		};

		const result = await (paymentService as BraintreePaymentService).createPayment(createPaymentRequest);

		expect(result).toMatchObject({
			id: "dummy-braintree-transaction-id",
			success: true,
			status: "authorized",
			amount: "1500.00",
			paymentReference: mockUpdatedPayment.id,
			additionalProcessorResponse: "Approved",
		});

		expect(paymentSDK.ctPaymentService.createPayment).toHaveBeenCalledWith({
			amountPlanned: mockCart.totalPrice,
			paymentMethodInfo: {
				paymentInterface: "braintree",
				method: PaymentMethodType.CARD,
			},
		});
		const expectedCreatePaymentRequest = {
			amount: "1500",
			options: { submitForSettlement: false },
			paymentMethodNonce: "dummy-nonce",
		};

		expect(BraintreeClient.prototype.createPayment).toHaveBeenCalledWith(expectedCreatePaymentRequest);

		expect(paymentSDK.ctPaymentService.updatePayment).toHaveBeenCalledWith({
			id: mockPayment.id,
			pspReference: "dummy-braintree-transaction-id",
			transaction: {
				type: "Authorization",
				amount: mockPayment.amountPlanned,
				interactionId: "dummy-braintree-transaction-id",
				state: "Success",
			},
		});
	});

	test("create card payment with incorrect currency in cart", async () => {
		const mockCart = mockGetCartResult();
		Object.defineProperty(mockCart.totalPrice, "currencyCode", {
			value: "EUR",
			writable: true,
		});
		const mockPayment = { ...mockGetPaymentResult, amountPlanned: mockCart.totalPrice };
		const mockUpdatedPayment = { ...mockUpdatePaymentResult, amountPlanned: mockCart.totalPrice };
		const mockBraintreeResponse = mockBrainTreeCreatePaymentResponse;

		jest.spyOn(paymentSDK.ctCartService, "getCart").mockResolvedValue(mockCart);
		jest.spyOn(paymentSDK.ctCartService, "getPaymentAmount").mockResolvedValue(mockCart.totalPrice);
		jest.spyOn(paymentSDK.ctCartService, "addPayment").mockResolvedValue(mockCart);
		jest.spyOn(paymentSDK.ctPaymentService, "createPayment").mockResolvedValue(mockPayment);
		jest.spyOn(paymentSDK.ctPaymentService, "updatePayment").mockResolvedValue(mockUpdatedPayment);
		jest.spyOn(BraintreeClient.prototype, "createPayment").mockResolvedValue(mockBraintreeResponse);
		jest.spyOn(BraintreeClient.prototype, "findMerchantAccount").mockResolvedValue(mockBraintreeMerchantAccount);
		const createPaymentRequest: CreatePaymentRequest = {
			data: {
				nonce: "dummy-nonce",
				paymentMethodType: PaymentMethodType.CARD,
			},
		};

		try {
			await (paymentService as BraintreePaymentService).createPayment(createPaymentRequest);
		} catch (error) {
			expect(error).toBeInstanceOf(Errorx);
			expect(error.message).toStrictEqual("cart and braintree merchant account currency do not match");
			expect(error.httpErrorStatus).toStrictEqual(400);
		}
	});
});
