/**
 * Represents the result of a payment.
 */
export type PaymentResult =
	| {
			/**
			 * Indicates whether the payment was successful.
			 */
			isSuccess: true;

			/**
			 * The payment reference.
			 */
			paymentReference: string;
	  }
	| {
			/**
			 * Indicates whether the payment was unsuccessful.
			 */
			isSuccess: false;

			/**
			 * The payment reference.
			 */
			paymentReference: string;

			/**
			 * The error message.
			 */
			message: string;
	  };
