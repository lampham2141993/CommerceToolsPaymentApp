import { createInputElement, type InputElementData } from "./createInputElement";

export type ButtonElementData = Omit<InputElementData, "type"> & {
	value: string;
	onClick: (event: MouseEvent) => void | Promise<void>;
};

export const createButtonElement = function (buttonData: ButtonElementData): HTMLInputElement {
	const buttonElement = createInputElement({ ...buttonData, type: "submit" });
	buttonElement.value = buttonData.value;
	buttonElement.addEventListener("click", buttonData.onClick);

	return buttonElement;
};
