import { VNPay, TEST_CONFIG } from '../../src/vnpay';
/* eslint-disable no-param-reassign */

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

	const checkoutUrl = vnpay.buildCheckoutUrl(checkoutData);
	res.locals.checkoutUrl = checkoutUrl;

	return checkoutUrl;
}

export function callbackVNPay(req, res) {
	const query = req.query;

	const isReturnQueryValid = vnpay.verifyReturnUrl(query);

	if (isReturnQueryValid) {
		res.locals.email = 'tu.nguyen@naustud.io';
		res.locals.orderId = query.vnp_TransactionNo || '';
		res.locals.price = query.vnp_Amount ? parseInt(query.vnp_Amount, 10) / 100 : 0;

		if (query.vnp_ResponseCode === '00') {
			res.locals.isSucceed = true;
		} else {
			res.locals.isSucceed = false;
		}
	} else {
		res.locals.isSucceed = false;
	}
}
