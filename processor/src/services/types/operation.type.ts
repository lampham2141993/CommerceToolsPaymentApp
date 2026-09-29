import { Payment } from "@commercetools/connect-payments-sdk/dist/commercetools";
import {
	AmountSchemaDTO,
	PaymentIntentRequestSchemaDTO,
	ConfigResponseSchemaDTO,
	StatusResponseSchemaDTO,
	PaymentModificationStatus,
} from "../../dtos/operation.dto";

export type CancelPaymentRequest = {
	payment: Payment;
	merchantReference?: string;
};

export type CapturePaymentRequest = {
	amount: AmountSchemaDTO;
	payment: Payment;
	merchantReference?: string;
};

export type ConfigResponse = ConfigResponseSchemaDTO;

export type ModifyPayment = {
	paymentId: string;
	data: PaymentIntentRequestSchemaDTO;
};

export type PaymentProviderModificationResponse = {
	outcome: PaymentModificationStatus;
	pspReference: string;
};

export type PaymentTransactionTypes = "CancelAuthorization" | "Charge" | "Refund";

export type RefundPaymentRequest = {
	amount: AmountSchemaDTO;
	payment: Payment;
	merchantReference?: string;
};

export type ReversePaymentRequest = {
	payment: Payment;
	merchantReference?: string;
};

export type StatusResponse = StatusResponseSchemaDTO;
