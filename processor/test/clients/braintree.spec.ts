import { ErrorGeneral } from "@commercetools/connect-payments-sdk";
import { BraintreeClient } from "../../src/clients/braintree.client";
import { BraintreeApiError } from "../../src/errors/braintree-api.error";
import { jest, describe, beforeEach, expect, it, beforeAll } from "@jest/globals";
import * as braintree from "braintree";

// Mock the braintree library
jest.mock("braintree", () => ({
	Environment: {
		Sandbox: "sandbox",
		Production: "production",
	},
	BraintreeGateway: jest.fn().mockImplementation(() => ({
		clientToken: {
			generate: jest.fn(),
		},
		transaction: {
			sale: jest.fn(),
			refund: jest.fn(),
			void: jest.fn(),
			submitForSettlement: jest.fn(),
		},
	})),
}));

// Mock the getConfig utility
jest.mock("../../src/dev-utils/getConfig", () => ({
	getConfig: jest.fn().mockReturnValue({
		braintreeEnvironment: "sandbox",
		braintreeMerchantId: "test-merchant-id",
		braintreePublicKey: "test-public-key",
		braintreePrivateKey: "test-private-key",
	}),
}));

describe("BraintreeClient", () => {
	let client: BraintreeClient;
	let mockGateway: any;

	beforeAll(() => {
		jest.clearAllMocks();
		client = BraintreeClient.getInstance();
		mockGateway = (braintree.BraintreeGateway as jest.Mock).mock.results[0].value;
	});

	describe("initiateSession", () => {
		it("should return a client token on successful generation", async () => {
			const mockResponse = { success: true, clientToken: "test-token" };
			mockGateway.clientToken.generate.mockResolvedValue(mockResponse);

			const response = await client.initiateSession();

			expect(response).toEqual(mockResponse);
			expect(mockGateway.clientToken.generate).toHaveBeenCalledWith({});
		});

		it("should throw a BraintreeApiError on failure", async () => {
			const mockError = new Error("Error generating Braintree client token.");
			mockGateway.clientToken.generate.mockRejectedValue(mockError);

			await expect(client.initiateSession()).rejects.toThrow("Unknown error.");
			await expect(client.initiateSession()).rejects.toBeInstanceOf(ErrorGeneral);
		});
	});

	describe("createPayment", () => {
		it("should return a transaction on successful payment creation", async () => {
			const mockTransaction = { id: "txn-123", status: "authorized" };
			const mockResponse = { success: true, transaction: mockTransaction };
			mockGateway.transaction.sale.mockResolvedValue(mockResponse);
			const request = {
				amount: "100.00",
				paymentMethodNonce: "nonce-123",
				options: { submitForSettlement: false },
			};
			const response = await client.createPayment(request);

			expect(response).toEqual(mockResponse);
			expect(mockGateway.transaction.sale).toHaveBeenCalledWith({
				amount: "100.00",
				channel: "commercetools_BT_XO_CT",
				paymentMethodNonce: "nonce-123",
				options: { submitForSettlement: false },
			});
		});

		it("should throw a BraintreeApiError if transaction fails and no transaction object is returned", async () => {
			const mockResponse = { success: false, message: "Payment failed" };
			mockGateway.transaction.sale.mockResolvedValue(mockResponse);
			const request = {
				amount: "100.00",
				paymentMethodNonce: "nonce-123",
				options: { submitForSettlement: false },
			};
			await expect(client.createPayment(request)).rejects.toThrow(BraintreeApiError);
		});
	});

	describe("refundPayment", () => {
		it("should return a transaction on successful refund", async () => {
			const mockTransaction = { id: "refund-123", status: "submitted_for_settlement" };
			const mockResponse = { success: true, transaction: mockTransaction };
			mockGateway.transaction.refund.mockResolvedValue(mockResponse);

			const response = await client.refundPayment("txn-123", "1234.00");

			expect(response).toEqual(mockResponse);
			expect(mockGateway.transaction.refund).toHaveBeenCalledWith("txn-123", "1234.00");
		});

		it("should throw a BraintreeApiError if refund fails", async () => {
			const mockResponse = { success: false, message: "Refund failed" };
			mockGateway.transaction.refund.mockResolvedValue(mockResponse);

			await expect(client.refundPayment("txn-123")).rejects.toThrow(BraintreeApiError);
		});
	});

	describe("cancelPayment", () => {
		it("should return a transaction on successful void", async () => {
			const mockTransaction = { id: "void-123", status: "voided" };
			const mockResponse = { success: true, transaction: mockTransaction };
			mockGateway.transaction.void.mockResolvedValue(mockResponse);

			const response = await client.cancelPayment("txn-123");

			expect(response).toEqual(mockResponse);
			expect(mockGateway.transaction.void).toHaveBeenCalledWith("txn-123");
		});

		it("should throw a BraintreeApiError if void fails", async () => {
			const mockResponse = { success: false, message: "Void failed" };
			mockGateway.transaction.void.mockResolvedValue(mockResponse);

			await expect(client.cancelPayment("txn-123")).rejects.toThrow(BraintreeApiError);
		});
	});

	describe("capturePayment", () => {
		it("should return a transaction on successful capture", async () => {
			const mockTransaction = { id: "capture-123", status: "submitted_for_settlement" };
			const mockResponse = { success: true, transaction: mockTransaction };
			mockGateway.transaction.submitForSettlement.mockResolvedValue(mockResponse);

			const response = await client.capturePayment("txn-123", "1234.00");

			expect(response).toEqual(mockResponse);
			expect(mockGateway.transaction.submitForSettlement).toHaveBeenCalledWith("txn-123", "1234.00");
		});

		it("should throw a BraintreeApiError if capture fails", async () => {
			const mockResponse = { success: false, message: "Capture failed" };
			mockGateway.transaction.submitForSettlement.mockResolvedValue(mockResponse);

			await expect(client.capturePayment("txn-123")).rejects.toThrow(BraintreeApiError);
		});
	});
});
