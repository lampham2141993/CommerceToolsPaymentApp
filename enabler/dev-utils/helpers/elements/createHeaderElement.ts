export type HeaderElementData = {
	type: `h${1 | 2 | 3 | 4}`;
	text: string;
	style?: string;
};

export const createHeaderElement = function ({ type, text, style }: HeaderElementData): HTMLHeadingElement {
	const headerElement = document.createElement(type);
	headerElement.innerText = text;
	if (style) {
		headerElement.setAttribute("style", style);
	}

	return headerElement;
};
