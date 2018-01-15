import { OnePayDomestic, OnePayInternational } from '../../src/onepay';
/* eslint-disable no-param-reassign */

const onepayIntl = new OnePayInternational({
	paymentGateway: 'https://mtf.onepay.vn/vpcpay/vpcpay.op',
	merchant: 'TESTONEPAY',
	accessCode: '6BEB2546',
	secureSecret: '6D0870CDE5F24F34F3915FB0045120DB',
});

const onepayDom = new OnePayDomestic({
	paymentGateway: 'https://mtf.onepay.vn/onecomm-pay/vpc.op',
	merchant: 'ONEPAY',
	accessCode: 'D67342C2',
	secureSecret: 'A3EFDFABA8653DF2342E8DAC29B51AF0',
});

export function checkoutOnePayDomestic(req, res) {
	const checkoutData = res.locals.checkoutData;
	checkoutData.returnUrl = `http://${req.headers.host}/payment/onepaydom/callback`;

	const checkoutUrl = onepayDom.buildCheckoutUrl(checkoutData);
	res.locals.checkoutUrl = checkoutUrl;

	return checkoutUrl;
}

export function callbackOnePayDomestic(req, res) {
	const query = req.query;

	const isReturnQueryValid = onepayDom.verifyReturnUrl(query);

	if (isReturnQueryValid) {
		res.locals.email = 'tu.nguyen@naustud.io';
		res.locals.orderId = query.vpc_TransactionNo || '';
		res.locals.price = query.vpc_Amount ? parseInt(query.vpc_Amount, 10) / 100 : 0;

		if (query.vpc_TxnResponseCode === '0') {
			res.locals.isSucceed = true;
		} else {
			res.locals.isSucceed = false;
		}
	} else {
		res.locals.isSucceed = false;
	}
}

export function checkoutOnePayInternational(req, res) {
	const checkoutData = res.locals.checkoutData;

	checkoutData.againLink = `http://${req.headers.host}/`; // back URL when user cancel payment
	checkoutData.returnUrl = `http://${req.headers.host}/payment/onepayintl/callback`;

	const checkoutUrl = onepayIntl.buildCheckoutUrl(checkoutData);
	res.locals.checkoutUrl = checkoutUrl;

	return checkoutUrl;
}

export function callbackOnePayInternational(req, res) {
	const query = req.query;

	const isReturnQueryValid = onepayIntl.verifyReturnUrl(query);

	if (isReturnQueryValid) {
		res.locals.email = 'tu.nguyen@naustud.io';
		res.locals.orderId = query.vpc_TransactionNo || '';
		res.locals.price = query.vpc_Amount ? parseInt(query.vpc_Amount, 10) / 100 : 0;
		res.billingStreet = query.vpc_AVS_Street01;
		res.billingCountry = query.vpc_AVS_StateProv;
		res.billingDistrict = query.vpc_AVS_City;
		res.billingPostalCode = query.vpc_AVS_PostCode;

		if (query.vpc_TxnResponseCode === '0') {
			res.locals.isSucceed = true;
		} else {
			res.locals.isSucceed = false;
		}
	} else {
		res.locals.isSucceed = false;
	}
}
