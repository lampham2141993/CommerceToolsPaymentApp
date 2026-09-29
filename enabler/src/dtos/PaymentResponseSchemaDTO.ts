import { type Static } from "@sinclair/typebox";
import { PaymentResponseSchema } from "./PaymentResponseSchema";

export type PaymentResponseSchemaDTO = Static<typeof PaymentResponseSchema>;
