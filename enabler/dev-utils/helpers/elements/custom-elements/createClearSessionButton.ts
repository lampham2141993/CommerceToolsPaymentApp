import { cocoSessionStore } from "../../../../src/store";
import { createButtonElement } from "../createButtonElement";

export const createClearSessionButton = (): HTMLInputElement =>
	createButtonElement({
		value: "Clear session",
		onClick: (event) => {
			event.preventDefault();
			if (window.confirm("Are you sure you want to clear the session and reload the page?")) {
				cocoSessionStore.dispatch({
					type: "CLEAR_SESSION",
				});
				location.reload();
			}
		},
	});
