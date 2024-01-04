var Transaction = require('dw/system/Transaction');
var service = require('~/cartridge/scripts/stripe/service');

// eslint-disable-next-line no-unused-vars
exports.beforePOST = function (basket, paymentInstrument) {
    if (paymentInstrument.paymentMethodId === 'STRIPE') {
        Transaction.wrap(function () {
            const prifile = request.session.customer.getProfile()
            if (!prifile.custom.stripeCustomerId) {
                // create stripe customer id
                prifile.custom.stripeCustomerId = "dummy_stripe_customer_id"
            }

            let intentId = "dummy_intent_id"
            if (paymentInstrument.c_stripePaymentMethodId) {
                // create intent id with stripe payment method id
            } else {
                // create intent id without stripe payment method id
            }
            request.custom.stripeIntentId = intentId;
        })
    }
};

exports.afterPOST = function (_order, _paymentInstrument) {
    // Do nothing
};

// eslint-disable-next-line no-unused-vars
exports.modifyPOSTResponse = function (basket, basketResponse, paymentInstrumentRequest) {
    var addedPayment = basketResponse.paymentInstruments.toArray().filter(function (instr) {
        return instr.paymentMethodId === "STRIPE";
    })[0];
    addedPayment.c_stripeIntentId = request.custom.stripeIntentId;

    // add Stripe payment methods

};