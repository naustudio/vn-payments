/* © 2018 NauStud.io
 * @author Eric Tran
 */

import SimpleSchema from 'simpl-schema';
import fetch from 'node-fetch';
import { parseString } from 'xml2js';
import { URL } from 'url';
import { createMd5Hash, toUpperCase } from '../utils';

/**
 * NganLuong payment gateway helper
 *
 * @example:
 * ```
 * import { NganLuong, TEST_CONFIG } from './imports/nganluong';
 *
 * const nganluongCheckout = new NganLuong({
 * 	paymentGateway: TEST_CONFIG.paymentGateway,
 * 	merchant: TEST_CONFIG.merchant,
 *  receiverEmail: TEST_CONFIG.receiverEmail,
 * 	secureSecret: TEST_CONFIG.secureSecret,
 * });
 *
 * // checkoutUrl is an URL instance
 * const checkoutUrl = await nganluongCheckout.buildCheckoutUrl(params);
 *
 * this.response.writeHead(301, { Location: checkoutUrl.href });
 * this.response.end();
 * ```
 */
class NganLuong {
	/**
	 * Instantiate a NganLuong checkout helper
	 *
	 * @param  {Object} config check NganLuong.configSchema for data type requirements
	 * @return {void}
	 */
	constructor(config) {
		this.config = Object.assign({}, config);
		// check type validity
		NganLuong.configSchema.validate(this.config);
	}

	/**
	 * Build checkoutUrl to redirect to the payment gateway
	 *
	 * Hàm xây dựng url để redirect qua NganLuong gateway, trong đó có tham số mã hóa (còn gọi là public key)
	 *
	 * @param  {Object} payload Object that contains needed data for the URL builder, refer to typeCheck object above
	 * @return {Promise} buildCheckoutUrl promise
	 */
	buildCheckoutUrl(payload) {
		return new Promise((resolve, reject) => {
			// Mảng các tham số chuyển tới NganLuong Payment
			const data = Object.assign({}, this.checkoutPayloadDefaults, payload);
			const config = this.config;

			data.nganluongSecretKey = config.secureSecret;
			data.nganluongMerchant = config.merchant;
			data.receiverEmail = config.receiverEmail;

			// Input type checking
			try {
				this.validateCheckoutPayload(data);
			} catch (error) {
				reject(error.message);
			}

			// Step 1: Map data to ngan luong checkout params
			/* prettier-ignore */
			const arrParam = {
				merchant_id            : data.nganluongMerchant,
				merchant_password      : createMd5Hash(data.nganluongSecretKey),
				version                : data.nganluongVersion,
				function               : data.nganluongCommand,
				receiver_email         : data.receiverEmail,
				order_code             : data.orderId,
				total_amount           : String(data.amount),
				payment_method         : data.paymentMethod,
				bank_code              : data.bankCode,
				payment_type           : data.paymentType,
				order_description      : data.orderInfo,
				tax_amount             : data.taxAmount,
				discount_amount        : data.discountAmount,
				fee_shipping           : data.feeShipping,
				return_url             : data.returnUrl,
				cancel_url             : data.cancelUrl,
				time_limit             : data.timeLimit,
				buyer_fullname         : data.customerName,
				buyer_email            : data.customerEmail,
				buyer_mobile           : data.customerPhone,
				buyer_address          : data.billingStreet,
				cur_code               : data.currency ? data.currency.toLowerCase() : 'vnd',
				lang_code              : data.locale,
				affiliate_code         : data.affiliateCode,
				total_item             : data.totalItem,
			};

			// Step 2: Post checkout data to ngan luong server
			const url = config.paymentGateway;
			const params = [];
			Object.keys(arrParam).forEach(key => {
				const value = arrParam[key];

				if (value == null || value.length === 0) {
					// skip empty params (but they must be optional)
					return;
				}

				if (value.length > 0) {
					params.push(`${key}=${encodeURIComponent(value)}`);
				}
			});

			const options = {
				method: 'POST',
			};

			fetch(`${url}?${params.join('&')}`, options)
				.then(rs => rs.text())
				.then(rs => {
					if (rs) {
						parseString(rs, (err, result) => {
							const objectResponse = result.result || {};
							if (objectResponse.error_code[0] === '00') {
								resolve({
									href: objectResponse.checkout_url[0],
								});
							} else {
								reject(new Error(objectResponse.description[0]));
							}
						});
					} else {
						reject(new Error('No response from nganluong server'));
					}
				})
				.catch(err => {
					reject(err);
				});
		});
	}

	/**
	 * Validate checkout payload against specific schema. Throw ValidationErrors if invalid against checkoutSchema
	 * Build the schema in subclass
	 * @param {*} payload
	 */
	validateCheckoutPayload(payload) {
		NganLuong.dataSchema.validate(payload);
	}

	/**
	 * @return {Object} default payload object
	 */
	get checkoutPayloadDefaults() {
		/* prettier-ignore */
		return {
			currency             : NganLuong.CURRENCY_VND,
			locale               : NganLuong.LOCALE_VN,
			nganluongVersion     : NganLuong.VERSION,
			nganluongCommand	 : NganLuong.COMMAND,
		};
	}

	/**
	 * @typedef NganLuongReturnObject
	 * @property {boolean} isSuccess whether the payment succeeded or not
	 * @property {string} message Approve or error message based on response code
	 * @property {string} merchant merchant ID, should be same with checkout request
	 * @property {string} transactionId merchant's transaction ID, should be same with checkout request
	 * @property {number} amount amount paid by customer, already divided by 100
	 * @property {number} orderInfo order info, should be same with checkout request
	 * @property {string} responseCode response code, payment has errors if it is non-zero
	 * @property {string} bankCode bank code of the bank where payment was occurred
	 * @property {string} bankTranNo bank transaction ID, used to look up at Bank's side
	 * @property {string} cardType type of card
	 * @property {string} payDate date when transaction occurred
	 * @property {string} gatewayTransactionNo Gateway's own transaction ID, used to look up at Gateway's side
	 * @property {string} secureHash checksum of the returned data, used to verify data integrity
	 *
	 * @property {string} vnp_TmnCode e.g: COCOSIN
	 * @property {string} vnp_TxnRef e.g: node-2018-01-15T10:04:36.540Z
	 * @property {string} vnp_Amount e.g: 90000000
	 * @property {string} vnp_OrderInfo e.g: Thanh toan giay adidas
	 * @property {string} vnp_ResponseCode e.g: 00
	 * @property {string} vnp_BankCode e.g: NCB
	 * @property {string} vnp_BankTranNo e.g: 20180115170515
	 * @property {string} vnp_CardType e.g: ATM
	 * @property {string} vnp_PayDate e.g: 20180115170716
	 * @property {string} vnp_TransactionNo e.g: 13008888
	 * @property {string} vnp_SecureHash e.g: 115ad37de7ae4d28eb819ca3d3d85b20
	 */
	/**
	 * Verify return query string from NganLuong using enclosed vnp_SecureHash string
	 *
	 * Hàm thực hiện xác minh tính đúng đắn của các tham số trả về từ nganluong Payment
	 *
	 * @param  {Object} query Query data object from GET handler (`response.query`)
	 * @return {NganLuongReturnObject}
	 */
	verifyReturnUrl(query) {
		const returnObject = this._mapQueryToObject(query);

		const data = Object.assign({}, query);
		const config = this.config;
		const vnpTxnSecureHash = data.vnp_SecureHash;
		const verifyResults = {};
		delete data.vnp_SecureHashType;
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

			if (toUpperCase(vnpTxnSecureHash) === toUpperCase(createMd5Hash(config.secureSecret + secureCode.join('&')))) {
				verifyResults.isSuccess = returnObject.responseCode === '00';
			} else {
				verifyResults.isSuccess = false;
				verifyResults.message = 'Wrong checksum';
			}
		}

		return Object.assign(returnObject, query, verifyResults);
	}

	_mapQueryToObject(query) {
		const returnObject = {
			merchant: query.vnp_TmnCode,
			transactionId: query.vnp_TxnRef,
			amount: parseInt(query.vnp_Amount, 10) / 100,
			orderInfo: query.vnp_OrderInfo,
			responseCode: query.vnp_ResponseCode,
			bankCode: query.vnp_BankCode,
			bankTranNo: query.vnp_BankTranNo,
			cardType: query.vnp_CardType,
			payDate: query.vnp_PayDate,
			gatewayTransactionNo: query.vnp_TransactionNo,
			secureHash: query.vnp_SecureHash,
			message: NganLuong.getReturnUrlStatus(query.vnp_ResponseCode), // no message from gateway, we'll look it up on our side
		};

		return returnObject;
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
			'04': {
				vn: 'Khởi tạo GD không thành công do Website đang bị tạm khóa',
				en: 'Payment website is not available',
			},
			'05': {
				vn:
					'Giao dịch không thành công do: Quý khách nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch',
				en: 'Transaction failed: Too many wrong password input',
			},
			'06': {
				vn:
					'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.',
				en: 'Transaction failed: Wrong OTP input',
			},
			'07': {
				vn:
					'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường). Đối với giao dịch này cần merchant xác nhận thông qua merchant admin: Từ chối/Đồng ý giao dịch',
				en: 'This transaction is suspicious',
			},
			'08': {
				vn:
					'Giao dịch không thành công do: Hệ thống Ngân hàng đang bảo trì. Xin quý khách tạm thời không thực hiện giao dịch bằng thẻ/tài khoản của Ngân hàng này.',
				en:
					'Transaction failed: The banking system is under maintenance. Please do not temporarily make transactions by card / account of this Bank.',
			},
			'09': {
				vn:
					'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
				en: 'Transaction failed: Cards / accounts of customer who has not yet registered for Internet Banking service.',
			},
			10: {
				vn: 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
				en: 'Transaction failed: Customer incorrectly validate the card / account information more than 3 times',
			},
			11: {
				vn: 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
				en: 'Transaction failed: Pending payment is expired. Please try again.',
			},
			24: {
				vn: 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
				en: 'Transaction canceled',
			},
			51: {
				vn: 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
				en: 'Transaction failed: Your account is not enough balance to make the transaction.',
			},
			65: {
				vn: 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
				en: 'Transaction failed: Your account has exceeded the daily limit.',
			},
			75: {
				vn: 'Ngân hàng thanh toán đang bảo trì',
				en: 'Banking system is under maintenance',
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

// The schema is based on field data requirements from NganLuong's dev document
/* prettier-ignore */
NganLuong.dataSchema = new SimpleSchema({
	createdDate 		 : { type: String, optional: true },
	amount               : { type: SimpleSchema.Integer },
	clientIp             : { type: String, max: 16 },
	currency             : { type: String, allowedValues: ['VND'] },
	billingCity          : { type: String, optional: true, max: 255 }, // NOTE: no max limit documented for optional fields, this is just a safe value
	billingCountry       : { type: String, optional: true, max: 255 },
	billingPostCode      : { type: String, optional: true, max: 255 },
	billingStateProvince : { type: String, optional: true, max: 255 },
	billingStreet        : { type: String, optional: true, max: 255 },
	customerId           : { type: String, optional: true, max: 255 },
	deliveryAddress      : { type: String, optional: true, max: 255 },
	deliveryCity         : { type: String, optional: true, max: 255 },
	deliveryCountry      : { type: String, optional: true, max: 255 },
	deliveryProvince     : { type: String, optional: true, max: 255 },
	locale               : { type: String, allowedValues: ['vi', 'en'] },
	orderId              : { type: String, max: 34 },
	receiverEmail        : { type: String, max: 255, regEx: SimpleSchema.RegEx.Email },
	paymentMethod        : { type: String, allowedValues: ['NL', 'VISA', 'ATM_ONLINE', 'ATM_OFFLINE', 'NH_OFFLINE', 'TTVP', 'CREDIT_CARD_PREPAID', 'IB_ONLINE'] },
	bankCode             : { type: String, max: 50 },
	paymentType          : { type: String, optional: true, allowedValues: ['1', '2'] },
	orderInfo            : { type: String, optional: true, max: 500 },
	taxAmount            : { type: SimpleSchema.Integer, optional: true },
	discountAmount       : { type: SimpleSchema.Integer, optional: true },
	feeShipping          : { type: SimpleSchema.Integer, optional: true },
	customerEmail        : { type: String, max: 255, regEx: SimpleSchema.RegEx.Email },
	customerPhone        : { type: String, max: 255 },
	customerName         : { type: String, max: 255 },
	returnUrl            : { type: String, max: 255, optional: true },
	cancelUrl            : { type: String, max: 255, optional: true },
	timeLimit            : { type: SimpleSchema.Integer, optional: true }, // minutes
	affiliateCode        : { type: String, max: 255, optional: true },
	totalItem            : { type: String, optional: true },
	transactionId        : { type: String, max: 40 },
	nganluongSecretKey   : { type: String, max: 32 },
	nganluongMerchant    : { type: String, max: 16 },
	nganluongCommand     : { type: String, max: 32 },
	nganluongVersion     : { type: String, max: 3 },
});

NganLuong.configSchema = new SimpleSchema({
	paymentGateway: { type: String, regEx: SimpleSchema.RegEx.Url },
	merchant: { type: String },
	receiverEmail: { type: String },
	secureSecret: { type: String },
});
// should not be changed
NganLuong.VERSION = '3.1';
NganLuong.COMMAND = 'SetExpressCheckout';
// nganluong only support VND
NganLuong.CURRENCY_VND = 'vnd';
NganLuong.LOCALE_EN = 'en';
NganLuong.LOCALE_VN = 'vi';

export { NganLuong };
