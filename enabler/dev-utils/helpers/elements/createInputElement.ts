export type InputElementData = {
	id?: string;
	type?: string;
	style?: string;
	isReadOnly?: boolean;
	isDisabled?: boolean;
	value?: string;
};

export const createInputElement = function ({
	id,
	type = "text",
	style,
	isReadOnly,
	isDisabled,
	value,
}: InputElementData): HTMLInputElement {
	const inputElement = document.createElement("input");
	if (id) {
		inputElement.setAttribute("id", id);
	}
	inputElement.setAttribute("type", type);
	if (style) {
		inputElement.setAttribute("style", style);
	}
	if (isReadOnly) {
		inputElement.readOnly = true;
	}
	if (isDisabled) {
		inputElement.disabled = true;
	}
	if (value) {
		inputElement.value = value;
	}

	return inputElement;
};
