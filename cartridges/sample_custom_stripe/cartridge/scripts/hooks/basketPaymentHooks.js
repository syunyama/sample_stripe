var Transaction = require('dw/system/Transaction');
var service = require('~/cartridge/scripts/stripe/service');
const Logger = require('dw/system/Logger');

// eslint-disable-next-line no-unused-vars
exports.beforePOST = function (basket, paymentInstrument) {
    var instruments = basket.getPaymentInstruments('STRIPE').iterator();
    if (instruments.hasNext()) {
        basket.removePaymentInstrument(instruments.next());
    }
    if (paymentInstrument.paymentMethodId === 'STRIPE') {
        Transaction.wrap(function () {
            const profile = request.session.customer.getProfile()
            if (!profile.custom.stripeCustomerId) {
                const customer = service.createCustomer(`${profile.lastName} ${profile.firstName}`, profile.email, profile.customerNo)
                profile.custom.stripeCustomerId = customer.id
            }
            const intent = service.createPaymentIntent(basket.getTotalGrossPrice().getValue(), basket.getCurrencyCode().toLowerCase(), paymentInstrument.c_stripePyamentMethodId, profile.custom.stripeCustomerId)
            request.custom.c_stripeIntentId = intent.id
            request.custom.c_stripePyamentMethodId = intent.payment_method
            request.custom.c_stripeClientSecret = intent.client_secret
        })
    }
};

// eslint-disable-next-line no-unused-vars
exports.afterPOST = function (basket, paymentInstrument) {
    Transaction.wrap(function () {
        var instruments = basket.getPaymentInstruments('STRIPE').iterator();
        if (instruments.hasNext()) {
            var instrument = instruments.next();
            instrument.custom.stripeIntentId = request.custom.c_stripeIntentId;
            instrument.custom.stripePaymentMethodId = request.custom.c_stripePyamentMethodId;
            instrument.custom.stripeClientSecret = request.custom.c_stripeClientSecret;
            instrument.custom.willSaved = paymentInstrument.c_willSaved;
        };
    })
}


