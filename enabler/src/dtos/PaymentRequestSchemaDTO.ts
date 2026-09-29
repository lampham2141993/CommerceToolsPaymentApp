import { type Static } from "@sinclair/typebox";
import { PaymentRequestSchema } from "./PaymentRequestSchema";

type PaymentRequestSchemaDTO = Static<typeof PaymentRequestSchema>;

export { type PaymentRequestSchemaDTO };
