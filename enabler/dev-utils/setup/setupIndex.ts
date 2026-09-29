import { BraintreePaymentEnabler, type PaymentComponent } from "../../src/payment-enabler";
import { createSession, fetchAccessToken, getConfig, tryUpdateSessionFromLocalStorage } from "..";
import { braintreeContainerId, createCheckoutButtonId } from "../../src/constants";
import { cocoSessionStore } from "../../src/store";
import { getPaymentMethods } from "../../src/integrations/braintree/operations";

const config = getConfig();

export const setupIndex = function () {
	tryUpdateSessionFromLocalStorage().then(() => {
		setupPaymentMethods();
		createCheckout();
	});
};

const setupPaymentMethods = async function () {
	const accessToken = await fetchAccessToken();

	const paymentMethodSelect = document.getElementById("paymentMethod");
	if (paymentMethodSelect) {
		const paymentMethods = await getPaymentMethods(accessToken);
		paymentMethods.components.forEach((component) => {
			const option = document.createElement("option");
			option.value = component.type;
			option.textContent = component.type;
			paymentMethodSelect.appendChild(option);
		});
		paymentMethods.dropins?.forEach((method) => {
			const option = document.createElement("option");
			option.value = `${method.type}`;
			option.textContent = `dropin-${method.type}`;
			paymentMethodSelect.appendChild(option);
		});
	} else {
		console.error('Cannot populate payment method selection, select with ID "paymentMethod" not found.');
	}
};

const createCheckout = async function () {
	const cartIdInputId = "cartId";
	const cartId = cocoSessionStore.getSnapshot()?.activeCart.cartRef.id;
	if (cartId) {
		(document.getElementById(cartIdInputId) as HTMLInputElement)!.value = cartId;
	}

	const createCheckoutButton = document.getElementById(createCheckoutButtonId);
	if (createCheckoutButton) {
		createCheckoutButton.addEventListener("click", async (event) => {
			event.preventDefault();
			const cartIdInput = document.getElementById(cartIdInputId) as HTMLInputElement | null;
			if (!cartIdInput) {
				console.error(`Cannot get cart Id, input element with ID ${cartIdInputId} not found.`);
				return;
			}
			const cartId = cartIdInput.value;
			if (!cartId) {
				console.error("Cart ID field is empty.");
				return;
			}

			let session = cocoSessionStore.getSnapshot();
			if (session?.activeCart.cartRef.id !== cartId) {
				await createSession(cartId);
				session = cocoSessionStore.getSnapshot();
			}

			const paymentMethodSelect = document.getElementById("paymentMethod") as HTMLSelectElement | null;
			if (!paymentMethodSelect) {
				console.error('Cannot get payment method selection, select with ID "paymentMethod" not found.');
				return;
			}

			const braintreeEnabler = new BraintreePaymentEnabler({
				processorUrl: config.PROCESSOR_URL,
				sessionId: session!.id,
				currency: "EUR",
				onComplete: (result) => {
					// TODO:  callback to complete purchase
					console.log("onComplete", result);
				},
				onError: (err) => {
					// TODO:  callback to handle error
					console.error("onError", err);
				},
			});

			const selectedPaymentMethod = paymentMethodSelect.value;

			let component: PaymentComponent;

			const componentBuilder = await braintreeEnabler.createComponentBuilder(selectedPaymentMethod);
			component = componentBuilder.build({
				showPayButton: !componentBuilder.componentHasSubmit,
				...(componentBuilder.componentHasSubmit
					? {}
					: {
							onPayButtonClick: async () => {
								// to be used for validation
								const termsChecked = (document.getElementById("termsCheckbox") as HTMLInputElement)
									?.checked;
								if (!termsChecked) {
									event.preventDefault();
									alert("You must agree to the terms and conditions.");
									return Promise.reject("error-occurred");
								}
								return Promise.resolve(); // change to true, to test payment flow
							},
						}),
			});

			component.mount(`#${braintreeContainerId}`);

			const customButton = document.createElement("button");
			customButton.textContent = "Pay with " + selectedPaymentMethod;
			customButton.className = "btn btn-lg btn-primary btn-block";
			customButton.addEventListener("click", async () => {
				// const termsChecked =
				//   document.getElementById("termsCheckbox").checked;
				// if (!termsChecked) {
				//   event.preventDefault();
				//   alert("You must agree to the terms and conditions.");
				//   return;
				// }

				// const shouldStorePaymentMethod =
				//   document.getElementById("storePaymentMethod").checked;

				// console.log(
				//   "Should store/tokenise the payment method?",
				//   shouldStorePaymentMethod,
				// );

				await component.submit();
			});
			const container = document.querySelector(`#${braintreeContainerId}`);
			if (!container) {
				throw new Error(`Container with selector "#${braintreeContainerId}" not found`);
			}
			container.appendChild(customButton);
		});
	} else {
		console.error('Cannot create checkout component, element with ID "createCheckout" not found.');
	}
};
