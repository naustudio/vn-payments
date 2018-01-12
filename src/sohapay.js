/* © 2017 NauStud.io
 * @author Tu Nguyen
 */

/*eslint-disable no-shadow, key-spacing, no-param-reassign*/
import SimpleSchema from 'simpl-schema';
import { URL } from 'url';

// The schema is based on field data requirements from VNPay's dev document
/* prettier-ignore */
const sohapayDataSchema = new SimpleSchema({
	amount               : { type: SimpleSchema.Integer, max: 9999999999 },
	clientIp             : { type: String, max: 16 },
	currency             : { type: String, allowedValues: ['VND'] },
	customerEmail        : { type: String, optional: true, max: 255, regEx: SimpleSchema.RegEx.Email },
	customerId           : { type: String, optional: true, max: 255 },
	customerPhone        : { type: String, optional: true, max: 255 },
	deliveryAddress      : { type: String, optional: true, max: 255 },
	deliveryCity         : { type: String, optional: true, max: 255 },
	deliveryCountry      : { type: String, optional: true, max: 255 },
	deliveryProvince     : { type: String, optional: true, max: 255 },
	bankCode             : { type: String, optional: true, max: 50 },
	locale               : { type: String, allowedValues: ['vn', 'en'] },
	orderId              : { type: String, max: 34 },
	orderInfo            : { type: String, max: 255 },
	orderType            : { type: String, max: 40 },
	returnUrl            : { type: String, max: 255 },
	transactionId        : { type: String, max: 40 },
	vnpSecretKey         : { type: String, max: 8 },
	vnpMerchant          : { type: String, max: 16 },
	vnpCommand           : { type: String, max: 16 },
	vnpVersion           : { type: String, max: 2 },
});

const sohaPayConfigSchema = new SimpleSchema({
	paymentGateway: { type: String },
	merchant: { type: String },
	secureSecret: { type: String },
});

class SohaPay {
	constructor(config) {
		this.config = Object.assign({}, config);
		sohaPayConfigSchema.validate(this.config);
	}

	buildCheckoutUrl(payload) {
	}

	verifyReturnUrl(data) {
		return false;
	}

	static getReturnUrlStatus(responseCode) {
	}
}

export { SohaPay };
