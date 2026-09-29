import { submitCreateCustomerId } from "../../src/constants";
import { createAndAddLabelledInputToParent, createButtonElement } from "../helpers/elements";
import { createSession } from "../createSession";

export const setupCreateSessionIdFields = function (
	mainPageId: string,
	onSessionCreatedCallback?: () => Promise<void> | void,
) {
	const mainPage = document.getElementById(mainPageId);
	let sessionContainer = document.createElement("div");
	const sessionContainerId = "sessionContainer";
	sessionContainer.setAttribute("id", sessionContainerId);
	const cartIdInputId = "cartIdInput";

	sessionContainer = createAndAddLabelledInputToParent(
		{
			id: cartIdInputId,
			label: "Existing cart ID:",
			labelStyle: "margin-right: 5px",
		},
		sessionContainer,
	);

	const createSessionButton = createButtonElement({
		id: submitCreateCustomerId,
		value: "Create Session",
		onClick: async (event: MouseEvent) => {
			event.preventDefault();

			const cartId = (document.getElementById(cartIdInputId) as HTMLInputElement)?.value;
			if (!cartId) {
				window.alert("Cart Id missing");
				return;
			}

			createSession(cartId)
				.then(() => {
					const sessionContainer = document.getElementById(sessionContainerId);
					if (sessionContainer) {
						sessionContainer.innerHTML = "";
					}
					onSessionCreatedCallback && onSessionCreatedCallback();
				})
				.catch((error) => {
					window.alert(`There was an error creating the session: ${error}`);
				});
		},
	});

	sessionContainer.appendChild(createSessionButton);
	mainPage?.appendChild(sessionContainer);
};
