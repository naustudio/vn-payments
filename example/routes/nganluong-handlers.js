import { NganLuong } from 'vn-payments';

/* eslint-disable no-param-reassign */
const TEST_CONFIG = NganLuong.TEST_CONFIG;
const nganluong = new NganLuong({
	paymentGateway: TEST_CONFIG.paymentGateway,
	merchant: TEST_CONFIG.merchant,
	receiverEmail: TEST_CONFIG.receiverEmail,
	secureSecret: TEST_CONFIG.secureSecret,
});

export function checkoutNganLuong(req, res) {
	const checkoutData = res.locals.checkoutData;
	checkoutData.returnUrl = `http://${req.headers.host}/payment/nganluong/callback`;
	checkoutData.cancelUrl = `http://${req.headers.host}/`;
	checkoutData.orderInfo = 'Thanh toan giay adidas';
	checkoutData.locale = checkoutData.locale === 'en' ? 'en' : 'vi';
	checkoutData.paymentType = '1';
	checkoutData.totalItem = '1';

	return nganluong.buildCheckoutUrl(checkoutData).then(checkoutUrl => {
		res.locals.checkoutUrl = checkoutUrl;

		return checkoutUrl;
	});
}

export function callbackNganLuong(req, res) {
	const query = req.query;

	return nganluong.verifyReturnUrl(query).then(results => {
		if (results) {
			res.locals.email = results.customerEmail;
			res.locals.orderId = results.transactionId || '';
			res.locals.price = results.amount;
			res.locals.isSucceed = results.isSuccess;
			res.locals.message = results.message;
		} else {
			res.locals.isSucceed = false;
		}
	});
}
