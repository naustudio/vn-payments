import { VNPay } from '../../src/vnpay';
/* eslint-disable no-param-reassign */

const vnpay = new VNPay({
	paymentGateway: 'http://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
	merchant: 'COCOSIN',
	secureSecret: 'RAOEXHYVSDDIIENYWSLDIIZTANXUXZFJ',
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

export function callbackVNPay(/* req , res */) {
	console.log('TODO: verify return params and decide status here');
}
