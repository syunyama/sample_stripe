var Transaction = require("dw/system/Transaction");
var service = require("~/cartridge/scripts/stripe/service");

// eslint-disable-next-line no-unused-vars
exports.beforePOST = function (basket, paymentInstrumentRequest) {
  const instruments = basket.getPaymentInstruments("STRIPE").iterator();
  if (instruments.hasNext()) {
    const instrument = instruments.next();
    basket.removePaymentInstrument(instrument);
  }
  if (paymentInstrumentRequest.paymentMethodId === "STRIPE") {
    Transaction.wrap(function () {
      const profile = request.session.customer.getProfile();
      if (!profile.custom.stripeCustomerId) {
        const customer = service.createCustomer(
          `${profile.lastName} ${profile.firstName}`,
          profile.email,
          profile.customerNo
        );
        profile.custom.stripeCustomerId = customer.id;
      }
      let intent;
      if (!basket.custom.stripeIntentId) {
        intent = service.createPaymentIntent(
          basket.getTotalGrossPrice().getValue(),
          basket.getCurrencyCode().toLowerCase(),
          paymentInstrumentRequest.c_stripePyamentMethodId,
          profile.custom.stripeCustomerId
        );
      } else {
        intent = service.updatePaymentIntent(
          basket.custom.stripeIntentId,
          basket.getTotalGrossPrice().getValue(),
          basket.getCurrencyCode().toLowerCase(),
          paymentInstrumentRequest.c_stripePyamentMethodId,
          profile.custom.stripeCustomerId
        );
      }
      basket.custom.stripeIntentId = intent.id;
      basket.custom.stripeClientSecret = intent.client_secret;
    });
  }
};

// eslint-disable-next-line no-unused-vars
exports.afterPOST = function (basket, paymentInstrumentRequest) {
  Transaction.wrap(function () {
    const instruments = basket.getPaymentInstruments("STRIPE").iterator();
    if (instruments.hasNext()) {
      const instrument = instruments.next();
      instrument.custom.stripePaymentMethodId =
        paymentInstrumentRequest.c_stripePyamentMethodId;
      instrument.custom.willSaved = paymentInstrumentRequest.c_willSaved;
      instrument.custom.stripeIntentId = basket.custom.stripeIntentId;
      instrument.custom.stripeClientSecret = basket.custom.stripeClientSecret;
    }
  });
};
