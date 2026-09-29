import { createInputElement, type InputElementData } from "./createInputElement";
import { createLabelElement, type LabelElementData } from "./createLabelElement";

export type LabelledInputData = Omit<InputElementData & LabelElementData, "style"> & {
	id: string;
	labelStyle?: string;
	inputStyle?: string;
};

export const createAndAddLabelledInputToParent = function <ParentElement extends HTMLElement>(
	labelledInputData: LabelledInputData,
	parentElement: ParentElement,
): ParentElement {
	parentElement.appendChild(
		createLabelElement({
			...labelledInputData,
			...{ style: labelledInputData.labelStyle },
		}),
	);
	parentElement.appendChild(
		createInputElement({
			...labelledInputData,
			...{ style: labelledInputData.inputStyle },
		}),
	);
	parentElement.appendChild(document.createElement("br"));

	return parentElement;
};
