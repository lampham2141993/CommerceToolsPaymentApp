import { Type } from "@sinclair/typebox";
import { PaymentOutcome } from "./PaymentOutcome";

const PaymentOutcomeSchema = Type.Enum(PaymentOutcome);

export { PaymentOutcomeSchema };
