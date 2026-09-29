import { tryUpdateSessionFromLocalStorage } from "../";
import {
	type CreateBraintreeCustomerRequest,
	createCustomer,
	deleteCustomer,
	findCustomer,
} from "../integrations/braintree/customer";
import { customerFormElementsData } from "./customerFormElementsData";
import { createCustomerFormId, customerPageId, submitCreateCustomerId } from "../../src/constants";
import { cocoSessionStore } from "../../src/store";
import { createAndAddLabelledInputToParent, createButtonElement, createHeaderElement } from "../helpers/elements";
import { setupCreateSessionIdFields } from "./setupCreateSessionFields";

export const setupCustomerPage = function () {
	tryUpdateSessionFromLocalStorage().then(() => {
		if (!cocoSessionStore.getSnapshot()?.id) {
			setupCreateSessionIdFields(customerPageId, createCustomerPage);
		} else {
			createCustomerPage();
		}
	});
};

const createCustomerPage = function () {
	createCreateCustomerForm();
	createFindCustomerFields();
	createDeleteCustomerFields();
};

const createCreateCustomerForm = function () {
	const customerPage = document.getElementById(customerPageId);
	customerPage?.appendChild(createHeaderElement({ type: "h4", text: "Create Customer" }));
	let createCustomerForm = document.createElement("form");
	createCustomerForm.setAttribute("id", createCustomerFormId);

	customerFormElementsData.forEach((inputData) => {
		createCustomerForm = createAndAddLabelledInputToParent(inputData, createCustomerForm);
	});

	const submitButton = createButtonElement({
		id: submitCreateCustomerId,
		value: "Create Customer",
		onClick: async (event: MouseEvent) => {
			event.preventDefault();

			let createCustomerBody: CreateBraintreeCustomerRequest = {
				firstName: "",
				lastName: "",
				email: "",
			};
			let missingRequiredParams: string[] = [];
			customerFormElementsData.forEach((elementData) => {
				const element = document.getElementById(elementData.id) as HTMLInputElement;
				if (!element) {
					console.error(`Element with id ${elementData.id} not found when creating customer`);
					return;
				}
				if (!element.value) {
					if (!elementData.isOptional) {
						missingRequiredParams.push(elementData.id);
					}
					return;
				}
				createCustomerBody[elementData.parameterName] = element.value;
			});

			if (missingRequiredParams.length > 0) {
				console.error(`Cannot submit, missing required params ${missingRequiredParams.join(", ")}`);
				return;
			}

			const sessionId = cocoSessionStore.getSnapshot()?.id;
			if (!sessionId) {
				window.alert("Session not active");
				return;
			}

			const customer = await createCustomer(sessionId, createCustomerBody);
			if (!customer) {
				window.alert("Create customer failed.");
				return;
			}

			window.alert(`Customer created, ID: ${customer.id}`);
		},
	});

	createCustomerForm.appendChild(submitButton);
	customerPage?.appendChild(createCustomerForm);
	customerPage?.appendChild(document.createElement("br"));
};

const createFindCustomerFields = function () {
	const customerPage = document.getElementById(customerPageId);
	let findCustomerContainer = document.createElement("div");
	findCustomerContainer?.appendChild(createHeaderElement({ type: "h4", text: "Find Customer" }));

	const findCustomerInputId = "findCustomerInputId";

	findCustomerContainer = createAndAddLabelledInputToParent(
		{
			id: findCustomerInputId,
			label: "Customer ID:",
			labelStyle: "margin-right: 5px",
		},
		findCustomerContainer,
	);

	findCustomerContainer.appendChild(
		createButtonElement({
			id: submitCreateCustomerId,
			value: "Find Customer",
			onClick: async (event: MouseEvent) => {
				event.preventDefault();

				const customerId = (document.getElementById(findCustomerInputId) as HTMLInputElement)?.value;
				if (!customerId) {
					window.alert("Customer Id missing");
					return;
				}

				const sessionId = cocoSessionStore.getSnapshot()?.id;
				if (!sessionId) {
					window.alert("Session not active");
					return;
				}

				const customer = await findCustomer(sessionId, {
					customerId: customerId,
				});
				if (!customer) {
					return;
				}
				window.alert(`Customer found, ID: ${customer.id}`);
			},
		}),
	);

	customerPage?.appendChild(findCustomerContainer);
	customerPage?.appendChild(document.createElement("br"));
};

const createDeleteCustomerFields = function () {
	const customerPage = document.getElementById(customerPageId);
	let deleteCustomerContainer = document.createElement("div");
	deleteCustomerContainer?.appendChild(createHeaderElement({ type: "h4", text: "Delete Customer" }));

	const deleteCustomerInputId = "deleteCustomerInputId";

	deleteCustomerContainer = createAndAddLabelledInputToParent(
		{
			id: deleteCustomerInputId,
			label: "Customer ID:",
			labelStyle: "margin-right: 5px",
		},
		deleteCustomerContainer,
	);

	deleteCustomerContainer.appendChild(
		createButtonElement({
			id: submitCreateCustomerId,
			value: "Delete Customer",
			onClick: async (event: MouseEvent) => {
				event.preventDefault();

				const customerId = (document.getElementById(deleteCustomerInputId) as HTMLInputElement)?.value;
				if (!customerId) {
					window.alert("Customer Id missing");
					return;
				}

				const sessionId = cocoSessionStore.getSnapshot()?.id;
				if (!sessionId) {
					window.alert("Session not active");
					return;
				}

				const successResponse = await deleteCustomer(sessionId, {
					customerId: customerId,
				});
				if (!successResponse) {
					window.alert(`Error deleting customer, ID: ${customerId}`);
					return;
				}
				window.alert(`Customer deleted, ID: ${customerId}`);
			},
		}),
	);

	customerPage?.appendChild(deleteCustomerContainer);
	customerPage?.appendChild(document.createElement("br"));
};
