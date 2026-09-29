import { Address, Cart, TransactionState } from "@commercetools/connect-payments-sdk";
import { PaymentAmount } from "@commercetools/connect-payments-sdk/dist/commercetools/types/payment.type";
import { type TransactionRequest, TransactionStatus } from "braintree";

export const mapBraintreeToCtResultCode = function (resultCode: TransactionStatus, success: boolean): TransactionState {
	switch (resultCode) {
		case "authorizing":
		case "settlement_pending":
		case "settling":
		case "submitted_for_settlement": {
			if (success) return "Success";
			return "Failure";
		}
		case "authorized":
		case "settlement_confirmed":
		case "settled":
		case "voided": {
			return "Success";
		}
		case "authorization_expired":
		case "settlement_declined":
		case "failed":
		case "gateway_rejected":
		case "processor_declined": {
			return "Failure";
		}
		default: {
			return "Initial";
		}
	}
};

export const mapToBraintreeCreatePaymentRequest = (cart: Cart, nonce: string): TransactionRequest => {
	const billing = mapBillingAddress(cart.billingAddress);
	const request: TransactionRequest = {
		amount: mapCtPaymentAmountToBraintreeAmount(cart.totalPrice),
		// merchantAccountId: getConfig().braintreeMerchantId,
		paymentMethodNonce: nonce,
		options: {
			submitForSettlement: false,
		},
	};
	if (billing) {
		request.billing = billing;
	}
	return request;
};

export const mapCtPaymentAmountToBraintreeAmount = (amountPlanned: PaymentAmount): string => {
	if (amountPlanned.centAmount <= 0 || amountPlanned.centAmount.toString().indexOf(".") !== -1) {
		throw new Error(
			`Payment cent amount must be a positive integer above zero, received ${amountPlanned.centAmount}.`,
		);
	}
	return (amountPlanned.centAmount / Math.pow(10, amountPlanned.fractionDigits)).toString();
};

const mapBillingAddress = (billingAddress: Address | undefined) => {
	if (!billingAddress) {
		return undefined;
	}
	const braintreeBillingAddress = {
		firstName: (billingAddress as Address).firstName,
		lastName: (billingAddress as Address).lastName,
		company: (billingAddress as Address).company,
		streetAddress: (billingAddress as Address).streetNumber + " " + (billingAddress as Address).streetName,
		extendedAddress: (billingAddress as Address).additionalStreetInfo,
		locality: (billingAddress as Address).city,
		region: (billingAddress as Address).state,
		postalCode: (billingAddress as Address).postalCode,
		countryCodeAlpha2: (billingAddress as Address).country,
	};
	return braintreeBillingAddress;
};
