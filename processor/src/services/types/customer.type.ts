import { CustomerCreateRequest, Customer } from "braintree";
import { CommercetoolsCartService, CommercetoolsPaymentService } from "@commercetools/connect-payments-sdk";

export type CreateCustomerRequest = CustomerCreateRequest;
export type CreateCustomerResponse = Customer;

export type BraintreeCustomerServiceOptions = {
	ctCartService: CommercetoolsCartService;
	ctPaymentService: CommercetoolsPaymentService;
};
