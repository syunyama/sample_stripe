// eslint-disable-next-line no-unused-vars
exports.beforePOST = function (basket, paymentInstrument) {};

exports.beforePATCH = function (order, paymentInstrument, update) {
    /** any mapping to allow backend systems to understand payment details */
    var transactionId = update.c_paymentDetails.instrument.transaction.id;
    order.paymentInstruments.iterator().next().getPaymentTransaction().transactionID = transactionId;

    // any other details posted to finalize endpoint can be added here
};

// eslint-disable-next-line
exports.afterPOST = function (order, paymentInstrument) {
    /** Provide additional information on how to finalize the payment. Should be implemented per payment type */
    var result;
    request.custom.paymentMethodId = paymentInstrument.paymentMethodId;
    // we should try to use existing payment hooks here vs this distribution code
    if (paymentInstrument.paymentMethodId === 'Giftcard') {
        result = {
            STATUS: 'SUCCESS',
            authorizedAmount: 10
        };
        order.getPaymentInstruments(request.custom.paymentMethodId)[0].paymentTransaction.setAmount(new dw.value.Money(10, order.getCurrencyCode()));

    // this payment method is mocked to always fail
    } else if (paymentInstrument.paymentMethodId === 'Paymentcard') {
        var status = (new dw.system.Status(dw.system.Status.ERROR, 'CARD_REJECTION', 'Auth Excection', { failureCode: 'AVS_COUNTRY', failureDetails: 'Card used in non supported country' }));
        return status;
    } else if (paymentInstrument.paymentMethodId === 'PaySite') {
        result = {
            action: 'REDIRECT',
            url: 'https://paysite.net/?order=' + order.orderNo
        };
    }
    // add json info to added payment instrument
    request.custom.mockPSPResponse = JSON.stringify(result);
    // needs to return, else order is finalized (placed)
};

exports.afterPATCH = function (order, basketResponse, paymentInstrumentRequest) {
    // set non paid amount to current payment method
    // needs verification
    var amountLeft = order.getTotalGrossPrice();
    var paidAmount = 0;
    order.paymentInstruments.toArray().forEach(function (instrument) {
        paidAmount += instrument.paymentTransaction.getAmount().value;
    });
    amountLeft = order.getTotalGrossPrice().subtract(new dw.value.Money(paidAmount, order.getCurrencyCode()));

    order.getPaymentInstruments(paymentInstrumentRequest.paymentMethodId)[0].paymentTransaction.setAmount(amountLeft);
};

// eslint-disable-next-line no-unused-vars
exports.modifyPOSTResponse = function (order, orderResponse, paymentInstrumentRequest) {
    /** this should be used to provide, non permanenlty stored information to the client */
    var result = JSON.parse(request.custom.mockPSPResponse);
    // retrieve payment, responsible for this hook execution
    var addedPayment = orderResponse.paymentInstruments.toArray().filter(function (instr) {
        return instr.paymentMethodId === request.custom.paymentMethodId;
    })[0];

    addedPayment.c_action = result;
    if (result.authorizedAmount) {
        // simulate one step peayment
        addedPayment.c_authorizedAmount = result.authorizedAmount;
    } else {
        // simulate 2 step payment and calculation of multi payments
        var amountLeft = order.getTotalGrossPrice();
        var paidAmount = 0;
        order.paymentInstruments.toArray().forEach(function (instrument) {
            paidAmount += instrument.paymentTransaction.getAmount().value;
        });
        amountLeft = order.getTotalGrossPrice().subtract(new dw.value.Money(paidAmount, order.getCurrencyCode()));
        addedPayment.c_amountToAuthorize = { value: amountLeft.value, currencyCode: amountLeft.currencyCode };
        addedPayment.c_action = result;
    }
};