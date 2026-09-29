import { type PaymentComponentBuilder } from "./PaymentComponentBuilder";

/**
 * Represents the payment enabler. The payment enabler is the entry point for creating the components.
 *
 * Usage:
 *    const enabler = new Enabler({
 *      processorUrl: __VITE_PROCESSOR_URL__,
 *      sessionId: sessionId,
 *      config: {
 *
 *      },
 *      onComplete: ({ isSuccess, paymentReference }) => {
 *        console.log('onComplete', { isSuccess, paymentReference });
 *      },
 *    });
 *
 *    enabler.createComponentBuilder('card')
 *      .then(builder => {
 *          const paymentElement = builder.build({
 *            showPayButton: false,
 *          });
 *          paymentElement.mount('#card-component')
 *      })
 *
 *    enabler.createComponentBuilder('invoice')
 *      .then(builder => {
 *          const paymentElement = builder.build({});
 *          paymentElement.mount('#invoice-component')
 *      })
 */
export interface PaymentEnabler {
	/**
	 * Creates a payment component builder of the specified type.
	 * @param type - The type of the payment component builder.
	 * @returns A promise that resolves to the payment component builder.
	 * @throws {Error} If the payment component builder cannot be created.
	 */
	createComponentBuilder: (type: string) => Promise<PaymentComponentBuilder | never>;
}
