import { SohaPay } from 'vn-payments';

/* eslint-disable no-param-reassign */
const TEST_CONFIG = SohaPay.TEST_CONFIG;
const sohapay = new SohaPay({
	merchantCode: TEST_CONFIG.merchantCode,
	paymentGateway: TEST_CONFIG.paymentGateway,
	secureSecret: TEST_CONFIG.secureSecret,
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

	return sohapay.verifyReturnUrl(query).then(results => {
		if (results) {
			res.locals.email = 'tu.nguyen@naustud.io';
			res.locals.orderId = results.transactionId || '';
			res.locals.price = results.amount;
			res.locals.isSucceed = results.isSuccess;
			res.locals.message = results.message;
		} else {
			res.locals.isSucceed = false;
		}
	});
}
