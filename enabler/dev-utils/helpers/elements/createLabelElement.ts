export type LabelElementData = {
	id?: string;
	label: string;
	style?: string;
};

export const createLabelElement = function ({ id, label, style }: LabelElementData): HTMLLabelElement {
	const labelElement = document.createElement("label");
	if (id) {
		labelElement.setAttribute("for", id);
	}
	if (style) {
		labelElement.setAttribute("style", style);
	}
	labelElement.appendChild(document.createTextNode(label));

	return labelElement;
};
