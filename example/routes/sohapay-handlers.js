import { SohaPay, TEST_SOHA_CONFIG } from '../../src/sohapay';
/* eslint-disable no-param-reassign */

const sohapay = new SohaPay({
	merchantCode: TEST_SOHA_CONFIG.merchantCode,
	paymentGateway: TEST_SOHA_CONFIG.paymentGateway,
	secureSecret: TEST_SOHA_CONFIG.secureSecret,
});

export function checkoutSohaPay(req, res) {
	const checkoutData = res.locals.checkoutData;

	checkoutData.returnUrl = `http://${req.headers.host}/payment/sohapay/callback`;
	checkoutData.transactionInfo = 'Thanh toan giay adidas';

	return sohapay.buildCheckoutUrl(checkoutData).then(checkoutUrl => {
		res.locals.checkoutUrl = checkoutUrl;

		return checkoutUrl;
	});
}

export function callbackSohaPay(req, res) {
	const query = req.query;

	const results = sohapay.verifyReturnUrl(query);

	console.log('result after check', results);

	if (results) {
		res.locals.email = 'tu.nguyen@naustud.io';
		res.locals.orderId = results.transactionId || '';
		res.locals.price = results.amount;
		res.locals.isSucceed = results.isSuccess;
		res.locals.message = results.message;
	} else {
		res.locals.isSucceed = false;
	}
}
