import { Type } from "@sinclair/typebox";

export const PaymentResponseSchema = Type.Object({
	id: Type.String(),
	paymentReference: Type.Optional(Type.String()),
	message: Type.Optional(Type.String()),
	success: Type.Boolean(),
	additionalProcessorResponse: Type.String(),
	amount: Type.String(),
	status: Type.String(),
	statusHistory: Type.Optional(
		Type.Array(
			Type.Object({
				amount: Type.String(),
				status: Type.String(),
				timestamp: Type.Any(),
				transactionSource: Type.Optional(Type.String()),
				user: Type.String(),
			}),
		),
	),
});
