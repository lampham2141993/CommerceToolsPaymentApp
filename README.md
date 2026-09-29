# Braintree Checkout payment connector

Checkout-compatible commercetools Connect connector for Braintree card and PayPal payments.

```
connect.yaml
processor/    # Payment processor: Braintree sale, commercetools Payment, cart link
enabler/      # Checkout UI for card and PayPal
```

A successful authorization creates a commercetools Payment, adds an Authorization transaction, and attaches that Payment to the cart. commercetools Checkout then creates the Order, so the transaction is on the Order.

The Braintree merchant account currency must match the cart currency. Set `BRAINTREE_ENVIRONMENT` to `sandbox` or `production`.

## Local development

```sh
cd processor
cp .env.template .env
npm install
npm test
npm run build
```

```sh
cd enabler
npm install
npm test
npm run build
```

## Install on Checkout

1. Push this repository and create a git tag.
2. Merchant Center → Manage organizations & teams → Connect → Organization connectors → Create connector. Select this repository and tag.
3. Request preview. After it is accepted, Deploy on Preview for the target project.
4. Enter the commercetools API client and Braintree sandbox or production credentials.
5. Checkout → Add application → Payment integrations → Standard Payments → Add payment integration.
6. Select this connector and add `card` and `paypal`. Activate each integration and the Checkout application.

The API client needs `manage_payments`, `manage_orders`, `view_sessions`, `manage_checkout_payment_intents`, `view_api_clients`, and `introspect_oauth_tokens`.
