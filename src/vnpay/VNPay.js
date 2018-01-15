/* © 2018 NauStud.io
 * @author Eric Tran
 */

import SimpleSchema from 'simpl-schema';
import { URL } from 'url';
import { vnPayDateFormat, createMd5Hash, toUpperCase } from '../utils';

/**
 * VNPay payment gateway helper
 *
 * @example:
 * ```
 * import { VNPay, TEST_CONFIG } from './imports/vnpay';
 *
 * const vnpayCheckout = new VNPay({
 * 	paymentGateway: TEST_CONFIG.paymentGateway,
 * 	merchant: TEST_CONFIG.merchant,
 * 	secureSecret: TEST_CONFIG.secureSecret,
 * });
 *
 * // checkoutUrl is an URL instance
 * const checkoutUrl = vnpayCheckout.buildCheckoutUrl(params);
 *
 * this.response.writeHead(301, { Location: checkoutUrl.href });
 * this.response.end();
 * ```
 */
class VNPay {
	/**
	 * Instantiate a VNPay checkout helper
	 *
	 * @param  {Object} config check VNPay.configSchema for data type requirements
	 * @return {void}
	 */
	constructor(config) {
		this.config = Object.assign({}, config);
		// check type validity
		VNPay.configSchema.validate(this.config);
	}

	/**
	 * Build checkoutUrl to redirect to the payment gateway
	 *
	 * Hàm xây dựng url để redirect qua VNPay gateway, trong đó có tham số mã hóa (còn gọi là public key)
	 *
	 * @param  {Object} payload Object that contains needed data for the URL builder, refer to typeCheck object above
	 * @return {URL}    The URL object used to redirect
	 */
	buildCheckoutUrl(payload) {
		// Mảng các tham số chuyển tới VNPay Payment
		const data = Object.assign({}, this.checkoutPayloadDefaults, payload);
		const config = this.config;

		data.vnpSecretKey = config.secureSecret;
		data.vnpMerchant = config.merchant;

		// Input type checking
		this.validateCheckoutPayload(data);

		// convert amount to VNPay format (100 = 1VND):
		data.amount = Math.floor(data.amount * 100);

		/* prettier-ignore */
		const arrParam = {
			vnp_Version        : data.vnpVersion,
			vnp_Command        : data.vnpCommand,
			vnp_TmnCode        : data.vnpMerchant,
			vnp_Locale         : data.locale,
			vnp_CurrCode       : data.currency,
			vnp_TxnRef         : data.orderId,
			vnp_OrderInfo      : data.orderInfo,
			vnp_OrderType      : data.orderType,
			vnp_Amount         : String(data.amount),
			vnp_ReturnUrl      : data.returnUrl,
			vnp_IpAddr         : data.clientIp,
			vnp_CreateDate     : data.createdDate || vnPayDateFormat(new Date()),
		};

		if (data.bankCode) {
			arrParam.vnp_BankCode = data.bankCode;
		}

		// Step 2. Create the target redirect URL at VNPay server
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

				if (value.length > 0 && (key.substr(0, 4) === 'vnp_' || key.substr(0, 5) === 'user_')) {
					// secureCode is digested from vnp_* params but they should not be URI encoded
					secureCode.push(`${key}=${value}`);
				}
			});

		/* Step 3. calculate the param checksum with md5*/

		if (secureCode.length > 0) {
			redirectUrl.searchParams.append('vnp_SecureHashType', 'MD5');
			redirectUrl.searchParams.append('vnp_SecureHash', createMd5Hash(data.vnpSecretKey + secureCode.join('&')));
		}
		console.log(redirectUrl);

		return redirectUrl;
	}

	/**
	 * Validate checkout payload against specific schema. Throw ValidationErrors if invalid against checkoutSchema
	 * Build the schema in subclass
	 * @param {*} payload
	 */
	validateCheckoutPayload(payload) {
		VNPay.dataSchema.validate(payload);
	}

	/**
	 * @return {Object} default payload object
	 */
	get checkoutPayloadDefaults() {
		/* prettier-ignore */
		return {
			currency             : VNPay.CURRENCY_VND,
			locale               : VNPay.LOCALE_VN,
			vnpVersion           : VNPay.VNP_VERSION,
			vnpCommand 			 : VNPay.VNP_COMMAND,
		};
	}

	/**
	 * Verify return query string from VNPay using enclosed vnp_SecureHash string
	 *
	 * Hàm thực hiện xác minh tính đúng đắn của các tham số trả về từ vnpay Payment
	 *
	 * @param  {Object} data Query data object from GET handler (`response.query`)
	 * @return {boolean}      Whether the return query params are genuine (hash checksum check)
	 */
	verifyReturnUrl(query) {
		const data = Object.assign({}, query);
		const config = this.config;
		const vnpTxnSecureHash = data.vnp_SecureHash;
		delete data.vnp_SecureHash;

		if (config.secureSecret.length > 0) {
			const secureCode = [];

			Object.keys(data)
				.sort() // need to sort the key by alphabetically
				.forEach(key => {
					const value = data[key];

					if (value.length > 0 && (key.substr(0, 4) === 'vnp_' || key.substr(0, 5) === 'user_')) {
						secureCode.push(`${key}=${value}`);
					}
				});

			if (toUpperCase(vnpTxnSecureHash) === toUpperCase(config.secureSecret + createMd5Hash(secureCode.join('&')))) {
				return true;
			}
		}

		return false;
	}

	static getReturnUrlStatus(responseCode, locale = 'vn') {
		const responseCodeTable = {
			'00': {
				vn: 'Giao dịch thành công',
				en: 'Approved',
			},
			'01': {
				vn: 'Giao dịch đã tồn tại',
				en: 'Transaction is already exist',
			},
			'02': {
				vn: 'Merchant không hợp lệ (kiểm tra lại vnp_TmnCode)',
				en: 'Invalid merchant (check vnp_TmnCode value)',
			},
			'03': {
				vn: 'Dữ liệu gửi sang không đúng định dạng',
				en: 'Sent data is not in the right format',
			},
			'08': {
				vn:
					'Giao dịch không thành công do: Hệ thống Ngân hàng đang bảo trì. Xin quý khách tạm thời không thực hiện giao dịch bằng thẻ/tài khoản của Ngân hàng này.',
				en:
					'Transaction failed: The banking system is under maintenance. Please do not temporarily make transactions by card / account of this Bank.',
			},
			default: {
				vn: 'Giao dịch thất bại',
				en: 'Failured',
			},
		};

		const respondText = responseCodeTable[responseCode];

		return respondText ? respondText[locale] : responseCodeTable.default[locale];
	}
}

// The schema is based on field data requirements from VNPay's dev document
/* prettier-ignore */
VNPay.dataSchema = new SimpleSchema({
	createdDate 		 : { type: String, optional: true },
	amount               : { type: SimpleSchema.Integer, max: 9999999999 },
	clientIp             : { type: String, max: 16 },
	currency             : { type: String, allowedValues: ['VND'] },
	billingCity          : { type: String, optional: true, max: 255 }, // NOTE: no max limit documented for optional fields, this is just a safe value
	billingCountry       : { type: String, optional: true, max: 255 },
	billingPostCode      : { type: String, optional: true, max: 255 },
	billingStateProvince : { type: String, optional: true, max: 255 },
	billingStreet        : { type: String, optional: true, max: 255 },
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
	vnpSecretKey         : { type: String, max: 32 },
	vnpMerchant          : { type: String, max: 16 },
	vnpCommand           : { type: String, max: 16 },
	vnpVersion           : { type: String, max: 2 },
});

VNPay.configSchema = new SimpleSchema({
	paymentGateway: { type: String, regEx: SimpleSchema.RegEx.Url },
	merchant: { type: String },
	secureSecret: { type: String },
});
// should not be changed
VNPay.VNP_VERSION = '2';
VNPay.VNP_COMMAND = 'pay';
// vnpay only support VND
VNPay.CURRENCY_VND = 'VND';
VNPay.LOCALE_EN = 'en';
VNPay.LOCALE_VN = 'vn';

export { VNPay };
