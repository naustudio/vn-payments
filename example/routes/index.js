/* eslint-disable no-param-reassign */

import { Router } from 'express';
import {
	checkoutOnePayDomestic,
	checkoutOnePayInternational,
	callbackOnePayDomestic,
	callbackOnePayInternational,
} from './onepay-handlers';
import { checkoutVNPay, callbackVNPay } from './vnpay-handlers';
import { checkoutSohaPay, callbackSohaPay } from './sohapay-handlers';

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
		clientIp: clientIp.length > 15 ? '127.0.0.1' : clientIp,
		locale: 'vn',
		// TODO: fill in billing address and ship address with address fields from form
		billingCity: params.billingCity || '',
		billingPostCode: params.billingPostCode || '',
		billingStateProvince: params.billingStateProvince || '',
		billingStreet: params.billingStreet || '',
		billingCountry: params.billingCountry || '',
		deliveryAddress: params.billingStreet || '',
		deliveryCity: params.billingCity || '',
		deliveryCountry: params.billingCountry || '',
		currency: 'VND',
		deliveryProvince: params.billingStateProvince || '',
		customerEmail: params.email,
		customerPhone: params.phoneNumber,
		orderId: `node-${now.toISOString()}`,
		// returnUrl: ,
		transactionId: `node-${now.toISOString()}`, // same as orderId (we don't have retry mechanism)
		customerId: params.email,
	};

	// pass checkoutData to gateway middleware via res.locals
	res.locals.checkoutData = checkoutData;

	// Note: these handler are asynchronous
	let asyncCheckout = null;
	switch (params.paymentMethod) {
		case 'onepayInternational':
			asyncCheckout = checkoutOnePayInternational(req, res);
			break;
		case 'onepayDomestic':
			asyncCheckout = checkoutOnePayDomestic(req, res);
			break;
		case 'vnPay':
			asyncCheckout = checkoutVNPay(req, res);
			break;
		case 'sohaPay':
			asyncCheckout = checkoutSohaPay(req, res);
			break;
		default:
			break;
	}

	if (asyncCheckout) {
		asyncCheckout
			.then(checkoutUrl => {
				res.writeHead(301, { Location: checkoutUrl.href });
				res.end();
			})
			.catch(err => {
				res.send(err);
			});
	} else {
		res.send('Payment method not found');
	}
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
		case 'sohapay':
			callbackSohaPay(req, res);
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
		message: res.locals.message,
		billingStreet: res.locals.billingStreet,
		billingCountry: res.locals.billingCountry,
		billingCity: res.locals.billingCity,
		billingStateProvince: res.locals.billingStateProvince,
		billingPostalCode: res.locals.billingPostalCode,
	});
});

export default routes;
