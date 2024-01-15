"use strict";

var LocalServiceRegistry = require("dw/svc/LocalServiceRegistry");
const Logger = require("dw/system/Logger");

function _getService(fn) {
  return LocalServiceRegistry.createService("stripe.service", {
    createRequest: fn,
    parseResponse: function (svc, client) {
      try {
        Logger.debug(
          "Response: {0} ;; Client: {1}",
          client.text,
          JSON.stringify(client)
        );
        return JSON.parse(client.text);
      } catch (e) {
        Logger.error(
          "Unable to Authenticate. Error: {0} ;; Response: {1} ;; Client: {2}",
          e.message,
          client.text,
          JSON.stringify(client)
        );
        return client.text;
      }
    },
    filterLogMessage: function (msg) {
      return msg;
    },
  });
}

function _getRetrieveServise() {
  return _getService(function (svc, endpoint) {
    // https://stripe.com/docs/api/authentication
    const requestURL = svc.getURL() + endpoint;
    const svcCredential = svc.getConfiguration().credential;
    svc
      .setAuthentication("NONE")
      .setRequestMethod("GET")
      .addHeader("Authorization", "Bearer " + svcCredential.user)
      .setURL(requestURL);
  });
}

function _getOperationService() {
  return _getService(function (svc, endpoint, make) {
    // https://stripe.com/docs/api/authentication
    const requestURL = svc.getURL() + endpoint;
    const svcCredential = svc.getConfiguration().credential;
    svc
      .setAuthentication("NONE")
      .setRequestMethod("POST")
      .addHeader("Authorization", "Bearer " + svcCredential.user)
      .setURL(requestURL);
    make(svc);
  });
}

function createCustomer(name, email, customerNo) {
  // https://stripe.com/docs/api/customers/create
  const service = _getOperationService();
  const res = service.call("/customers", function (svc) {
    svc.addParam("name", name);
    svc.addParam("email", email);
    svc.addParam("metadata[cc_customer_no]", customerNo);
  });
  return res.object;
}

function createPaymentIntent(amount, currency, paymentMethodId, customerId) {
  // https://stripe.com/docs/api/payment_intents/create
  const service = _getOperationService();
  const res = service.call("/payment_intents", function (svc) {
    svc.addParam("amount", amount * 100);
    svc.addParam("currency", currency);
    svc.addParam("payment_method", paymentMethodId);
    svc.addParam("customer", customerId);
  });
  return res.object;
}

function updatePaymentIntent(
  id,
  amount,
  currency,
  paymentMethodId,
  customerId
) {
  // https://stripe.com/docs/api/payment_intents/create
  const service = _getOperationService();
  const res = service.call(`/payment_intents/${id}`, function (svc) {
    svc.addParam("amount", amount * 100);
    svc.addParam("currency", currency);
    svc.addParam("payment_method", paymentMethodId);
    svc.addParam("customer", customerId);
  });
  return res.object;
}

function cancelPaymentIntent(id) {
  // https://stripe.com/docs/api/payment_intents/create
  const service = _getOperationService();
  const res = service.call(`/payment_intents/${id}/cancel`, function (svc) {
    svc.addParam("cancellation_reason", "requested_by_customer");
  });
  return res.object;
}

function listPaymentMethods(customerId) {
  // https://stripe.com/docs/api/payment_methods/list
  const service = _getRetrieveServise();
  const res = service.call(`/payment_methods?customer=${customerId}`);
  return res.object;
}

module.exports = {
  createCustomer,
  createPaymentIntent,
  listPaymentMethods,
  updatePaymentIntent,
  cancelPaymentIntent,
};
