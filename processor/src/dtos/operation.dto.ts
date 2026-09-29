import { Type, Static } from "@sinclair/typebox";

export const AmountSchema = Type.Object({
	centAmount: Type.Integer(),
	currencyCode: Type.String(),
	fractionDigits: Type.Integer(),
});

export type AmountSchemaDTO = Static<typeof AmountSchema>;

export enum PaymentModificationStatus {
	APPROVED = "approved",
	REJECTED = "rejected",
	RECEIVED = "received",
}

const PaymentModificationSchema = Type.Enum(PaymentModificationStatus);

export const SupportedPaymentComponentsData = Type.Object({
	type: Type.String(),
	subtypes: Type.Optional(Type.Array(Type.String())),
});

const DropinType = Type.Enum({
	EMBEDDED: "embedded",
	HPP: "hpp",
});

export const SupportedPaymentDropinsData = Type.Object({
	type: DropinType,
});

const TransactionStatePending = Type.Literal("Pending", {
	description: "The authorization/capture has not happened yet. Most likely because we need to receive notification.",
});

const TransactionStateFailed = Type.Literal("Failed", {
	description: "Any error that occured for which the system can't recover automatically from.",
});

const TransactionStateComplete = Type.Literal("Completed", {
	description: "If there is a successful authorization/capture on the payment-transaction.",
});

export const TransactionStatusState = Type.Union([
	TransactionStateComplete,
	TransactionStateFailed,
	TransactionStatePending,
]);

export const ActionCancelPaymentSchema = Type.Composite([
	Type.Object({
		action: Type.Literal("cancelPayment"),
		merchantReference: Type.Optional(Type.String()),
	}),
]);

export const ActionCapturePaymentSchema = Type.Composite([
	Type.Object({
		action: Type.Literal("capturePayment"),
	}),
	Type.Object({
		amount: AmountSchema,
		merchantReference: Type.Optional(Type.String()),
	}),
]);

export const ActionRefundPaymentSchema = Type.Composite([
	Type.Object({
		action: Type.Literal("refundPayment"),
	}),
	Type.Object({
		amount: AmountSchema,
		merchantReference: Type.Optional(Type.String()),
	}),
]);

export const ActionReversePaymentSchema = Type.Composite([
	Type.Object({
		action: Type.Literal("reversePayment"),
	}),
	Type.Object({
		amount: AmountSchema,
		merchantReference: Type.Optional(Type.String()),
	}),
]);

/**
 * Public shareable payment provider configuration. Do not include any sensitive data.
 */
export const ConfigResponseSchema = Type.Any();

export type ConfigResponseSchemaDTO = Static<typeof ConfigResponseSchema>;

/**
 * Payment intent request schema.
 *
 * Example:
 * {
 *  "actions": [
 *   {
 *    "action": "capturePayment",
 *    "amount": {
 *      "centAmount": 100,
 *      "currencyCode": "EUR"
 *    }
 *  ]
 * }
 */
export const PaymentIntentRequestSchema = Type.Object({
	actions: Type.Array(
		Type.Union([
			ActionCapturePaymentSchema,
			ActionRefundPaymentSchema,
			ActionCancelPaymentSchema,
			ActionReversePaymentSchema,
		]),
		{
			maxItems: 1,
		},
	),
});

export type PaymentIntentRequestSchemaDTO = Static<typeof PaymentIntentRequestSchema>;

export const PaymentIntentResponseSchema = Type.Object({
	outcome: PaymentModificationSchema,
	pspReference: Type.String(),
});

export type PaymentIntentResponseSchemaDTO = Static<typeof PaymentIntentResponseSchema>;

/**
 * Status response schema.
 *
 * Example:
 * {
 *    "status": "OK",
 *    "timestamp": "2024-07-15T14:00:43.068Z",
 *    "version": "3.0.2",
 *    "metadata": {
 *        "name": "payment-integration-template",
 *        "description": "Payment provider integration template",
 *        "@commercetools/connect-payments-sdk": "<version>"
 *    },
 *    "checks": [
 *        {
 *            "name": "CoCo Permissions",
 *            "status": "UP"
 *        },
 *        {
 *            "name": "Mock Payment API",
 *            "status": "UP"
 *        }
 *    ]
 *  }
 *
 *
 */
export const StatusResponseSchema = Type.Object({
	status: Type.String(),
	timestamp: Type.String(),
	version: Type.String(),
	metadata: Type.Optional(Type.Any()),
	checks: Type.Array(
		Type.Object({
			name: Type.String(),
			status: Type.String(),
			details: Type.Optional(Type.Any()),
			message: Type.Optional(Type.String()),
		}),
	),
});

export type StatusResponseSchemaDTO = Static<typeof StatusResponseSchema>;

/**
 * Supported payment components schema.
 *
 * Example:
 * {
 *   "dropins": [
 *     {
 *       "type": "embedded"
 *     }
 *   ],
 *   "components": [
 *     {
 *       "type": "card"
 *     },
 *     {
 *       "type": "applepay"
 *     }
 *   ]
 * }
 */
export const SupportedPaymentComponentsSchema = Type.Object({
	dropins: Type.Array(SupportedPaymentDropinsData),
	components: Type.Array(SupportedPaymentComponentsData),
});

export type SupportedPaymentComponentsSchemaDTO = Static<typeof SupportedPaymentComponentsSchema>;

export const TransactionDraft = Type.Object({
	cartId: Type.String({ format: "uuid" }),
	paymentInterface: Type.String({ format: "uuid" }),
	amount: Type.Optional(
		Type.Object({
			centAmount: Type.Number(),
			currencyCode: Type.String(),
		}),
	),
	futureOrderNumber: Type.Optional(Type.String()),
});

export type TransactionDraftDTO = Static<typeof TransactionDraft>;

export const TransactionResponse = Type.Object({
	transactionStatus: Type.Object({
		state: TransactionStatusState,
		errors: Type.Array(
			Type.Object({
				code: Type.Literal("PaymentRejected"),
				message: Type.String(),
			}),
		),
	}),
});

export type TransactionResponseDTO = Static<typeof TransactionResponse>;
