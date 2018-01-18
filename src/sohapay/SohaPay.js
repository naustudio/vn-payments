/* © 2017 NauStud.io
 * @author Tu Nguyen
 */

import SimpleSchema from 'simpl-schema';
import { URL } from 'url';
import { toUpperCase, hashHmac, pack } from '../utils';

class SohaPay {
	constructor(config = {}) {
		this.config = Object.assign({}, config);
		SohaPay.configSchema.validate(this.config);
	}

	/**
	 * Build checkout URL to redirect to the payment gateway
	 *
	 * @param  {Object} payload Object that contains needed data for the URL builder
	 * @return {URL}    The URL object used to redirect
	 */
	buildCheckoutUrl(payload) {
		return new Promise((resolve, reject) => {
			// Mảng các tham số chuyển tới Onepay Payment
			const data = Object.assign({}, this.checkoutPayloadDefaults, payload);
			const config = this.config;

			data.siteCode = config.merchantCode;
			data.paymentType = '';

			// Input type checking
			try {
				this.validateCheckoutPayload(data);
			} catch (error) {
				reject(error.message);
			}

			/* prettier-ignore */
			const arrParam = {
				language			: data.language,
				order_code			: data.orderId,
				order_email			: data.customerEmail,
				order_mobile		: data.customerPhone,
				payment_type		: data.paymentType,
				price				: data.amount.toString(),
				return_url			: data.returnUrl,
				site_code			: data.siteCode,
				transaction_info	: data.transactionInfo,
				version				: data.version,
			};

			// Step 2. Create the target redirect URL at SohaPay server
			const redirectUrl = new URL(config.paymentGateway);
			const secureCode = [];

			Object.keys(arrParam)
				.sort()
				.forEach(key => {
					const value = arrParam[key];

					if (value == null || value.length === 0) {
						// skip empty params (but they must be optional)
						return;
					}

					redirectUrl.searchParams.append(key, value); // no need to encode URI with URLSearchParams object

					if (value.length > 0) {
						// secureCode is digested from vnp_* params but they should not be URI encoded
						secureCode.push(`${key}=${value}`);
					}
				});

			if (secureCode.length > 0) {
				redirectUrl.searchParams.append(
					'secure_hash',
					toUpperCase(hashHmac('SHA256', secureCode.join('&'), pack(config.secureSecret)))
				);
			}

			resolve(redirectUrl);
		});
	}

	/**
	 * Validate checkout payload against checkoutSchema. Throw ValidationErrors if invalid.
	 *
	 * @param {*} payload
	 */
	validateCheckoutPayload(payload) {
		SohaPay.checkoutSchema.validate(payload);
	}

	get checkoutPayloadDefaults() {
		/* prettier-ignore */
		return {
			language             : SohaPay.LANGUAGE_VN,
			version           	 : SohaPay.VERSION,
		};
	}

	/**
	 * Verify return query string from payment gateway
	 *
	 * @param  {Object} query Query data object from GET handler (`response.query`)
	 * @return {boolean}      Whether the return query params are genuine (hash checksum check)
	 */
	verifyReturnUrl(query) {
		const returnObject = this._mapQueryToObject(query);

		const data = Object.assign({}, query);
		const config = this.config;

		const secureHash = data.secure_code;
		const verifyResults = {};
		delete data.secure_code;
		// delete data.vnp_SecureHash;

		if (config.secureSecret.length > 0) {
			const secureCode = [];

			Object.keys(data)
				.sort() // need to sort the key by alphabetically
				.forEach(key => {
					const value = data[key];

					if (value.length > 0) {
						secureCode.push(`${key}=${value}`);
					}
				});

			if (
				toUpperCase(secureHash) === toUpperCase(hashHmac('SHA256', secureCode.join('&'), pack(config.secureSecret)))
			) {
				if (data.error_text.length === 0) {
					verifyResults.isSuccess = returnObject.responseCode === '0';
				} else {
					verifyResults.isSuccess = false;
					verifyResults.message = data.error_text;
				}
			} else {
				verifyResults.isSuccess = false;
				verifyResults.message = 'Wrong checksum';
			}
		}

		return Object.assign(returnObject, query, verifyResults);
	}

	_mapQueryToObject(query) {
		const returnObject = {
			message: query.error_text,
			transactionId: query.order_code,
			orderEmail: query.order_email,
			orderSession: query.order_session,
			amount: query.price,
			responseCode: query.response_code,
			responseMessage: query.response_message,
			siteCode: query.site_code,
			transactionInfo: query.transaction_info,
			secureCode: query.secure_code,
		};

		return returnObject;
	}
}

// static properties
SohaPay.configSchema = new SimpleSchema({
	merchantCode: { type: String },
	paymentGateway: { type: String },
	secureSecret: { type: String },
});

/* prettier-ignore */
SohaPay.checkoutSchema = new SimpleSchema({
	language				: { type: String, max: 16 },
	orderId					: { type: String, max: 34 },
	customerEmail			: { type: String, max: 254 },
	customerPhone			: { type: String, max: 15 },
	returnUrl				: { type: String, max: 255 },
	amount					: { type: SimpleSchema.Integer, max: 9999999999 },
	paymentType				: { type: String, max: 1 },
	siteCode				: { type: String, max: 8 },
	transactionInfo			: { type: String, max: 255 },
	version					: { type: String, max: 1 },
	locale					: { type: String, optional: true, max: 2 },
	currency				: { type: String, optional: true, max: 4 },
	billingCity				: { type: String, optional: true, max: 64 },
	billingCountry			: { type: String, optional: true, max: 2 },
	billingPostCode			: { type: String, optional: true, max: 64 },
	billingStateProvince	: { type: String, optional: true, max: 64 },
	billingStreet			: { type: String, optional: true, max: 64 },
	deliveryAddress      	: { type: String, optional: true, max: 255 },
	deliveryCity         	: { type: String, optional: true, max: 255 },
	deliveryCountry      	: { type: String, optional: true, max: 255 },
	deliveryProvince     	: { type: String, optional: true, max: 255 },
	clientIp				: { type: String, optional: true, max: 15 },
	transactionId			: { type: String, optional: true, max: 40 },
	customerId				: { type: String, optional: true, max: 255 },
});

SohaPay.LANGUAGE_VN = 'vi';
SohaPay.LANGUAGE_EN = 'en';
SohaPay.VERSION = '2';

export { SohaPay };
