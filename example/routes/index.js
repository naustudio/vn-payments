/* eslint-disable no-param-reassign */

import { Router } from 'express';
import {
	checkoutOnePayDomestic,
	checkoutOnePayInternational,
	callbackOnePayDomestic,
	callbackOnePayInternational,
} from './onepay-handlers';
import { checkoutVNPay, callbackVNPay } from './vnpay-handlers';

const routes = Router();

/**
 * GET home page with the mock shopping cart
 */
routes.get('/', (req, res) => {
	res.render('index', { title: 'Nau Store' });
});

/**
 * GET thank you page
 */
routes.get('/success', (req, res) => {
	res.render('result', {
		title: 'Nau Store',
		isSucceed: true,
		email: 'tu.nguyen@naustud.io',
		orderId: '6433',
		price: '5000000',
	});
});

routes.get('/fail', (req, res) => {
	res.render('result', {
		title: 'Nau Store',
		email: 'tu.nguyen@naustud.io',
		orderId: '6433',
		price: '5000000',
	});
});

routes.post('/payment/checkout', (req, res) => {
	const userAgent = req.headers['user-agent'];
	console.log('userAgent', userAgent);

	const params = Object.assign({}, req.body);

	const clientIp =
		req.headers['x-forwarded-for'] ||
		req.connection.remoteAddress ||
		req.socket.remoteAddress ||
		(req.connection.socket ? req.connection.socket.remoteAddress : null);

	const amount = parseInt(params.amount.replace(/,/g, ''), 10);
	const now = new Date();

	const checkoutData = {
		amount,
		clientIp,
		locale: 'vn',
		// TODO: fill in billing address and ship address with address fields from form
		billingCity: params.district || '',
		billingCountry: '',
		billingPostCode: params.postal || '',
		billingStateProvince: params.country || '',
		billingStreet: params.address || '',
		currency: 'VND',
		deliveryAddress: '',
		deliveryCity: '',
		deliveryCountry: '',
		deliveryProvince: '',
		customerEmail: params.email,
		customerPhone: params.phoneNumber,
		orderId: `node-${now.toISOString()}`,
		// returnUrl: ,
		transactionId: `node-${now.toISOString()}`, // same as orderId (we don't have retry mechanism)
		customerId: params.email,
	};

	// pass checkoutData to gateway middleware via res.locals
	res.locals.checkoutData = checkoutData;

	// Note: these handler are synchronous
	switch (params.paymentMethod) {
		case 'onepayInternational':
			checkoutOnePayInternational(req, res);
			break;
		case 'onepayDomestic':
			checkoutOnePayDomestic(req, res);
			break;
		case 'vnPay':
			checkoutVNPay(req, res);
			break;
		default:
			break;
	}

	const checkoutUrl = res.locals.checkoutUrl;

	res.writeHead(301, { Location: checkoutUrl.href });
	res.end();
});

routes.get('/payment/:gateway/callback', (req, res) => {
	const gateway = req.params.gateway;
	console.log('gateway', req.params.gateway);

	switch (gateway) {
		case 'onepaydom':
			callbackOnePayDomestic(req, res);
			break;
		case 'onepayintl':
			callbackOnePayInternational(req, res);
			break;
		case 'vnpay':
			callbackVNPay(req, res);
			break;
		default:
			break;
	}

	// TODO: render callback result here
	res.render('result', {
		title: `Nau Store Payment via ${gateway.toUpperCase()}`,
		isSucceed: res.locals.isSucceed,
		email: res.locals.email,
		orderId: res.locals.orderId,
		price: res.locals.price,
		billingStreet: res.billingStreet,
		billingCountry: res.billingCountry,
		billingDistrict: res.billingDistrict,
		billingPostalCode: res.billingPostalCode,
	});
});

export default routes;
