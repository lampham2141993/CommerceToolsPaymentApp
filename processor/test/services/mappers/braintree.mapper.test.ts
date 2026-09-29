import { describe, expect, test, jest } from "@jest/globals";
import { mapToBraintreeCreatePaymentRequest } from "../../../src/services/mappers";
import { mockGetCartResult } from "../../utils/mock-cart-data";
import { CentPrecisionMoney } from "@commercetools/platform-sdk";

describe("mapCtTotalPriceToBraintreeAmount", () => {
	const cart = mockGetCartResult();
	const nonce = "fake-nonce";
	test("throws error when centAmount passed is a non-positive integer or 0", () => {
		Object.defineProperty(cart.totalPrice, "centAmount", {
			value: -1,
			writable: true,
		});

		expect(() => mapToBraintreeCreatePaymentRequest(cart, nonce)).toThrow(
			`Payment cent amount must be a positive integer above zero, received -1.`,
		);

		Object.defineProperty(cart.totalPrice, "centAmount", {
			value: 1.2,
			writable: true,
		});

		expect(() => mapToBraintreeCreatePaymentRequest(cart, nonce)).toThrow(
			`Payment cent amount must be a positive integer above zero, received 1.2.`,
		);

		Object.defineProperty(cart.totalPrice, "centAmount", {
			value: 0,
			writable: true,
		});
		expect(() => mapToBraintreeCreatePaymentRequest(cart, nonce)).toThrow(
			`Payment cent amount must be a positive integer above zero, received 0.`,
		);
	});

	test("returns string version of centAmount passed when fractionDigits are zero", async () => {
		Object.defineProperty(cart.totalPrice, "centAmount", {
			value: 3457,
			writable: true,
		});

		expect(mapToBraintreeCreatePaymentRequest(cart, nonce)).toStrictEqual({
			amount: "34.57",
			options: {
				submitForSettlement: false,
			},
			paymentMethodNonce: "fake-nonce",
		});

		Object.defineProperty(cart.totalPrice, "centAmount", {
			value: 800000000,
			writable: true,
		});

		expect(mapToBraintreeCreatePaymentRequest(cart, nonce)).toStrictEqual({
			amount: "8000000",
			options: {
				submitForSettlement: false,
			},
			paymentMethodNonce: "fake-nonce",
		});

		Object.defineProperty(cart.totalPrice, "centAmount", {
			value: 1,
			writable: true,
		});
		expect(mapToBraintreeCreatePaymentRequest(cart, nonce)).toStrictEqual({
			amount: "0.01",
			options: {
				submitForSettlement: false,
			},
			paymentMethodNonce: "fake-nonce",
		});
	});

	test("returns string version of centAmount/10 passed when fractionDigits are 1", () => {
		Object.defineProperty(cart.totalPrice, "centAmount", {
			value: 3457,
			writable: true,
		});

		Object.defineProperty(cart.totalPrice, "fractionDigits", {
			value: 1,
			writable: true,
		});

		expect(mapToBraintreeCreatePaymentRequest(cart, nonce)).toStrictEqual({
			amount: "345.7",
			options: {
				submitForSettlement: false,
			},
			paymentMethodNonce: "fake-nonce",
		});

		Object.defineProperty(cart.totalPrice, "centAmount", {
			value: 800000000,
			writable: true,
		});

		expect(mapToBraintreeCreatePaymentRequest(cart, nonce)).toStrictEqual({
			amount: "80000000",
			options: {
				submitForSettlement: false,
			},
			paymentMethodNonce: "fake-nonce",
		});

		Object.defineProperty(cart.totalPrice, "centAmount", {
			value: 1,
			writable: true,
		});
		expect(mapToBraintreeCreatePaymentRequest(cart, nonce)).toStrictEqual({
			amount: "0.1",
			options: {
				submitForSettlement: false,
			},
			paymentMethodNonce: "fake-nonce",
		});
	});
});
