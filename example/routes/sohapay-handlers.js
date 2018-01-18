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

	const checkoutUrl = sohapay.buildCheckoutUrl(checkoutData);
	res.locals.checkoutUrl = checkoutUrl;

	return checkoutUrl;
}
