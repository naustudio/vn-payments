/* © 2017 NauStud.io
 * @author Eric Tran
 */

/*eslint-disable no-shadow, key-spacing, no-param-reassign*/
import SimpleSchema from 'simpl-schema';
import { URL } from 'url';
import { toUpperCase, vnPayDateFormat, createMd5Hash } from './utils';

// The schema is based on field data requirements from VNPay's dev document
/* prettier-ignore */
const vnpayDataSchema = new SimpleSchema({
	amount               : { type: SimpleSchema.Integer, max: 9999999999 },
	againLink            : { type: String },
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

const vnpayConfigSchema = new SimpleSchema({
	paymentGateway: { type: String },
	merchant: { type: String },
	secureSecret: { type: String },
});

/**
 * VNPay payment gateway helper
 *
 * @example:
 * ```
 * import VNPay from './imports/vnpay';
 *
 * const vnpayCheckout = new VNPay({
 * 	paymentGateway: VNPay.GATEWAY_INTERNATIONAL,
 * 	accessCode: VNPay.TEST_INTL_ACCESS_CODE,
 * 	secureSecret: VNPay.TEST_INTL_SECURE_SECRET,
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
	 * @param  {Object} config check function source for required properties
	 * @return {void}
	 */
	constructor(config) {
		this.config = Object.assign({}, config);
		// check type validity
		vnpayConfigSchema.validate(this.config);
	}

	/**
	 * Build checkoutUrl to redirect to the payment gateway
	 *
	 * Hàm xây dựng url, trong đó có tham số mã hóa (còn gọi là public key)
	 *
	 * @param  {Object} payload Object that contains needed data for the URL builder, refer to typeCheck object above
	 * @return {URL}    The URL object used to redirect
	 */
	buildCheckoutUrl(payload) {
		// Mảng các tham số chuyển tới VNPay Payment
		const data = Object.assign({}, VNPay.payloadDefaults, payload);
		const config = this.config;

		data.vnpSecretKey = config.secureSecret;
		data.vnpMerchant = config.merchant;

		// Input type checking
		vnpayDataSchema.validate(data);

		// convert amount to VNPay format (100 = 1VND):
		data.amount = Math.floor(data.amount * 100);

		// IMPORTANT: the keys' order must be exactly like below
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
			vnp_CreateDate     : vnPayDateFormat(new Date()),
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

		// console.log('redirectUrl:', redirectUrl);

		return redirectUrl;
	}

	/**
	 * Verify return query string from VNPay using enclosed vnp_SecureHash string
	 *
	 * Hàm thực hiện xác minh tính đúng đắn của các tham số trả về từ vnpay Payment
	 *
	 * @param  {Object} data Query data object from GET handler (`response.query`)
	 * @return {boolean}      Whether the return query params are genuine (hash checksum check)
	 */
	verifyReturnUrl(data) {
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

	static getReturnUrlStatus(responseCode) {
		let result;

		switch (String(responseCode)) {
			case '00':
				result = 'Giao dịch thành công - Approved';
				break;
			case '01':
				result = 'Giao dịch đã tồn tại';
				break;
			case '02':
				result = 'Merchant không hợp lệ (kiểm tra lại vnp_TmnCode)';
				break;
			case '03':
				result = 'Dữ liệu gửi sang không đúng định dạng';
				break;
			case '08':
				result =
					'Giao dịch không thành công do: Hệ thống Ngân hàng đang bảo trì. Xin quý khách tạm thời không thực hiện giao dịch bằng thẻ/tài khoản của Ngân hàng này.';
				break;
			default:
				result = 'Giao dịch thất bại - Failured';
		}

		return result;
	}
}

// should not be changed
VNPay.GATEWAY_DOSMESTIC = 'http://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
VNPay.VNP_VERSION = '2';
VNPay.VNP_COMMAND = 'pay';
// vnpay only support VND
VNPay.CURRENCY_VND = 'VND';
VNPay.LOCALE_EN = 'en';
VNPay.LOCALE_VN = 'vn';

// Test accounts
VNPay.TEST_DOMESTIC_MERCHANT = 'COCOSIN';
VNPay.TEST_DOMESTIC_SECURE_SECRET = 'RAOEXHYVSDDIIENYWSLDIIZTANXUXZFJ';

VNPay.TEST_RETURN_URL = '/vnpay/callback';

/* prettier-ignore */
VNPay.payloadDefaults = {
	currency             : VNPay.CURRENCY_VND,
	deliveryAddress      : '',
	deliveryCity         : '',
	deliveryCountry      : '',
	deliveryProvince     : '',
	customerEmail        : '',
	customerPhone        : '',
	locale               : VNPay.LOCALE_VN,
	returnUrl            : VNPay.TEST_RETURN_URL,
	transactionId        : '',
	customerId           : '',
	vnpVersion           : VNPay.VNP_VERSION,
	vnpCommand 			 : VNPay.VNP_COMMAND,
};

/* eslint-disable no-unused-vars */
// for reference, not used for now
const vnpayDomReturnSchema = new SimpleSchema(
	{
		vnp_TmnCode: String,
		vnp_TxnRef: String,
		vnp_Amount: Number,
		vnp_OrderInfo: String,
		vnp_ResponseCode: String,
		vnp_BankCode: String,
		vnp_BankTranNo: String,
		vnp_PayDate: String,
		vnp_TransactionNo: String,
		vnp_SecureHash: String,
	},
	{ requiredByDefault: false }
);

export { VNPay };
