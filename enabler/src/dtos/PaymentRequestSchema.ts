import { Type } from "@sinclair/typebox";
import { PaymentOutcomeSchema } from "./PaymentOutcomeSchema";

const PaymentRequestSchema = Type.Object({
	paymentMethod: Type.Object({
		type: Type.String(),
		poNumber: Type.Optional(Type.String()),
		invoiceMemo: Type.Optional(Type.String()),
	}),
	paymentOutcome: PaymentOutcomeSchema,
});

export { PaymentRequestSchema };
