import { devPageId } from "../../src/constants";
import { createAndAddLabelledInputToParent, createButtonElement, createHeaderElement } from "../helpers/elements";
import { createClearSessionButton } from "../helpers/elements/custom-elements";
import { cocoSessionStore } from "../../src/store";
import { fetchAdminToken } from "../fetchAdminToken";
import { createSession } from "../";
import { queryProducts } from "../integrations/commercetools/product";
import { tryUpdateSessionFromLocalStorage } from "../tryUpdateSessionFromLocalStorage";
import { createCartWithLineItem } from "../integrations/commercetools/cart";
import { findTransaction } from "../integrations/braintree/transaction";

export const setupDevPage = function () {
	let devPage = document.getElementById(devPageId);

	tryUpdateSessionFromLocalStorage().then(() => {
		if (!devPage) {
			console.error("Dev page not found on setup.");
			return;
		}
		if (!cocoSessionStore.getSnapshot()?.id) {
			createCreateCartForm(devPage);
		} else {
			createDevPage(devPage);
		}
	});
};

const createDevPage = function (devPage: HTMLElement) {
	const cartId = cocoSessionStore.getSnapshot()?.activeCart.cartRef.id;
	if (!cartId) {
		console.error("No active cart Id in session");
		return;
	}
	createCartDetailsForm(devPage, cartId);
	createProductsForm(devPage);
	createFindTransactionForm(devPage);
};

const createCreateCartForm = function (devPage: HTMLElement) {
	let createCartFormContainer = document.createElement("div");
	createCartFormContainer.appendChild(createHeaderElement({ type: "h4", text: "Create cart" }));

	const cartKeyInputId = "cartKeyInputId";

	createCartFormContainer = createAndAddLabelledInputToParent(
		{
			id: cartKeyInputId,
			label: "Cart key:",
			labelStyle: "margin-right: 5px",
			inputStyle: "min-width: 310px",
		},
		createCartFormContainer,
	);

	createCartFormContainer.appendChild(
		createButtonElement({
			id: "createCart",
			value: "Create cart and session",
			onClick: async (event) => {
				event.preventDefault();

				const cartKey = (document.getElementById(cartKeyInputId) as HTMLInputElement)?.value;
				if (!cartKey) {
					window.alert("Cart key field must be set");
					return;
				}

				const oauthAccessToken = await fetchAdminToken();

				const cart = await createCartWithLineItem(oauthAccessToken, cartKey);

				if (!cart.id) {
					throw Error("Error creating cart, cart has no id");
				}

				await createSession(cart.id);

				devPage.innerHTML = "";
				createDevPage(devPage);
			},
		}),
	);
	createCartFormContainer.appendChild(document.createElement("br"));
	devPage.appendChild(createCartFormContainer);
};

const createCartDetailsForm = function (devPage: HTMLElement, cartSessionId: string) {
	let createCartDetailsContainer = document.createElement("div");

	createCartDetailsContainer.appendChild(createHeaderElement({ type: "h4", text: "Cart details" }));

	createCartDetailsContainer = createAndAddLabelledInputToParent(
		{
			id: "cartIdInSession",
			label: "Cart ID in session: ",
			labelStyle: "margin-right: 5px",
			inputStyle: "min-width: 310px",
			isReadOnly: true,
			isDisabled: true,
			value: cartSessionId,
		},
		createCartDetailsContainer,
	);
	createCartDetailsContainer.appendChild(createClearSessionButton());
	createCartDetailsContainer.appendChild(document.createElement("br"));
	createCartDetailsContainer.appendChild(document.createElement("br"));
	devPage.appendChild(createCartDetailsContainer);
};

const createProductsForm = function (devPage: HTMLElement) {
	let productsContainer = document.createElement("div");

	productsContainer.appendChild(createHeaderElement({ type: "h4", text: "Products" }));
	productsContainer.appendChild(
		createButtonElement({
			value: "Get products",
			onClick: async (event: MouseEvent) => {
				event.preventDefault();

				let products = await queryProducts();
				console.log(products);
			},
		}),
	);
	productsContainer.appendChild(document.createElement("br"));
	productsContainer.appendChild(document.createElement("br"));
	devPage.appendChild(productsContainer);
};

const createFindTransactionForm = function (devPage: HTMLElement) {
	let findTransactionFormContainer = document.createElement("div");

	findTransactionFormContainer.appendChild(createHeaderElement({ type: "h4", text: "Find transaction" }));
	const transactionIdFieldId = "transactionId";
	findTransactionFormContainer = createAndAddLabelledInputToParent(
		{
			id: transactionIdFieldId,
			label: "Transaction ID: ",
			labelStyle: "margin-right: 5px",
			inputStyle: "min-width: 310px",
		},
		findTransactionFormContainer,
	);

	findTransactionFormContainer.appendChild(
		createButtonElement({
			value: "Find transaction",
			onClick: async (event: MouseEvent) => {
				event.preventDefault();

				const sessionId = cocoSessionStore.getSnapshot()?.id;
				if (!sessionId) {
					window.alert("Session must be active");
					return;
				}

				const transactionId = (document.getElementById(transactionIdFieldId) as HTMLInputElement)?.value;

				if (!transactionId) {
					window.alert("Transaction ID must be filled.");
					return;
				}

				const transaction = await findTransaction(sessionId, transactionId);
				window.alert(`Transaction found, status: ${transaction.status} full object in logged to console.`);
				console.log("Transaction: ", transaction);
			},
		}),
	);
	findTransactionFormContainer.appendChild(document.createElement("br"));

	devPage.appendChild(findTransactionFormContainer);
};
