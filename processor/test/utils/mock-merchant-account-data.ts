import { type MerchantAccount } from "braintree";

export const mockBraintreeMerchantAccount: MerchantAccount = {
	status: "Active",
	id: "commercetools",
	currencyIsoCode: "USD",
	default: true,
	funding: {
		destination: "",
	},
	individual: {
		addressDetails: {
			locality: "city",
			postalCode: "postalCode",
			region: "region",
			streetAddress: "street",
		},
		dateOfBirth: "1970-01-01",
		email: "test@test.net",
		firstName: "dummy-firstname",
		lastName: "dummy-lastname",
	},
};
