"use strict";

var LocalServiceRegistry = require("dw/svc/LocalServiceRegistry");
const Logger = require('dw/system/Logger');

function getService(fn) {
    return LocalServiceRegistry.createService(
        "stripe.service",
        {
            createRequest: fn,
            parseResponse: function (svc, client) {
                try {
                    return JSON.parse(client.text);
                } catch (e) {
                    Logger.error('Unable to Authenticate. Error: {0} ;; Response: {1} ;; Client: {2}', e.message, client.text, JSON.stringify(client));
                    return client.text
                }
            },
            filterLogMessage: function (msg) {
                return msg;
            },
        }
    );
}

function getRetrieveServise() {
    return getService(function (svc, endpoint) {
        // https://stripe.com/docs/api/authentication
        const requestURL = svc.getURL() + endpoint
        const svcCredential = svc.getConfiguration().credential;
        svc.setAuthentication("NONE")
            .setRequestMethod("GET")
            .addHeader('Authorization', 'Bearer ' + svcCredential.user)
            .setURL(requestURL);
    })
}

function getOperationService() {
    return getService(function (svc, endpoint, request) {
        // https://stripe.com/docs/api/authentication
        const requestURL = svc.getURL() + endpoint
        const svcCredential = svc.getConfiguration().credential;
        svc.setAuthentication("NONE")
            .setRequestMethod("POST")
            .addHeader('Authorization', 'Bearer ' + svcCredential.user)
            .setURL(requestURL);
        return JSON.stringify(request);
    })
}

function createCustomer(cc_customer_id) {
    // https://stripe.com/docs/api/customers/create
    const service = getOperationService()
    const res = service.call("/customers", {
        metadata: {
            cc_customer_id
        }
    })
    return res.object;
}

function createPaymentIntent(amount, currency) {
    // https://stripe.com/docs/api/payment_intents/create
    const service = getOperationService()
    const res = service.call("/payment_intents", {
        amount,
        currency
    })
    return res.object;
}

function updatePaymentIntent(id, payment_method) {
    // https://stripe.com/docs/api/payment_intents/update
    const service = getOperationService()
    const res = service.call(`/payment_intents/${id}`, {
        payment_method
    })
    return res.object;
}

function confirmPaymentIntent(id) {
    // https://stripe.com/docs/api/payment_intents/update
    const service = getOperationService()
    const res = service.call(`/payment_intents/${id}/confirm`, {})
    return res.object;
}

function listPaymentMethods() {
    // https://stripe.com/docs/api/payment_methods/list
    const service = getRetrieveServise()
    const res = service.call("/payment_methods")
    return res.object;
}

module.exports = {
    createCustomer,
    createPaymentIntent,
    updatePaymentIntent,
    listPaymentMethods,
    confirmPaymentIntent
};
