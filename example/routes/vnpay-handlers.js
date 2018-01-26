import { VNPay } from 'vn-payments';

/* eslint-disable no-param-reassign */
const TEST_CONFIG = VNPay.TEST_CONFIG;
const vnpay = new VNPay({
	paymentGateway: TEST_CONFIG.paymentGateway,
	merchant: TEST_CONFIG.merchant,
	secureSecret: TEST_CONFIG.secureSecret,
});

export function checkoutVNPay(req, res) {
	const checkoutData = res.locals.checkoutData;

	checkoutData.returnUrl = `http://${req.headers.host}/payment/vnpay/callback`;
	checkoutData.orderInfo = 'Thanh toan giay adidas';
	checkoutData.orderType = 'fashion';

	return vnpay.buildCheckoutUrl(checkoutData).then(checkoutUrl => {
		res.locals.checkoutUrl = checkoutUrl;

		return checkoutUrl;
	});
}

export function callbackVNPay(req, res) {
	const query = req.query;

	return vnpay.verifyReturnUrl(query).then(results => {
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
