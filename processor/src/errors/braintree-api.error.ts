import { Errorx, ErrorxAdditionalOpts } from "@commercetools/connect-payments-sdk";

export type BraintreeApiErrorData = {
	status: number;
	name?: string;
	type?: string;
	message?: string;
};

export class BraintreeApiError extends Errorx {
	constructor(errorData: BraintreeApiErrorData, additionalOpts?: ErrorxAdditionalOpts) {
		super({
			code: `BraintreeError-${errorData.name}`,
			httpErrorStatus: errorData.status,
			message: errorData.message || `error type : ${errorData.type}`,
			...additionalOpts,
		});
	}
}
