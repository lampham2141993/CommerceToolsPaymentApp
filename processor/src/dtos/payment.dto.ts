import { Type, Static } from "@sinclair/typebox";

export enum PaymentMethodType {
	CARD = "card",
	PAYPAL = "paypal",
}

export const BraintreeInitRequestSchema = Type.Object({});

export type BraintreeInitRequestSchemaDTO = Static<typeof BraintreeInitRequestSchema>;

export const BraintreeInitResponseSchema = Type.Object({
	clientToken: Type.String(),
	paymentReference: Type.String(),
	amount: Type.String(),
	currencyCode: Type.String(),
});

export type BraintreeInitResponseSchemaDTO = Static<typeof BraintreeInitResponseSchema>;

export const CreatePaymentResponseSchema = Type.Object({
	id: Type.String(),
	success: Type.Boolean(),
	message: Type.Optional(Type.String()),
	paymentReference: Type.String(),
	additionalProcessorResponse: Type.Optional(Type.String()),
	amount: Type.String(),
	status: Type.String(),
});

export type CreatePaymentResponseSchemaDTO = Static<typeof CreatePaymentResponseSchema>;

export const PaymentRequestSchema = Type.Object({
	nonce: Type.String(),
	paymentMethodType: Type.Enum(PaymentMethodType),
	paymentReference: Type.Optional(Type.String()),
});

export type PaymentRequestSchemaDTO = Static<typeof PaymentRequestSchema>;
