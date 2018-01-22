/* © 2018 NauStud.io
 * @author Eric Tran
 */

import SimpleSchema from 'simpl-schema';
import fetch from 'node-fetch';
import { parseString } from 'xml2js';
import { createMd5Hash } from '../utils';

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
					params.push(`${key}=${encodeURI(value)}`);
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
		return new Promise((resolve, reject) => {
			const data = {};
			const config = this.config;
			const token = query.token;
			if (!token) {
				resolve({
					isSuccess: false,
					message: 'No token found',
				});
			}
			data.nganluongSecretKey = config.secureSecret;
			data.nganluongMerchant = config.merchant;
			data.receiverEmail = config.receiverEmail;

			// Step 1: Map data to ngan luong get detail params
			/* prettier-ignore */
			const arrParam = {
				merchant_id            : data.nganluongMerchant,
				merchant_password      : createMd5Hash(data.nganluongSecretKey),
				version                : data.nganluongVersion,
				function               : 'GetTransactionDetail',
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
								const returnObject = this._mapQueryToObject(objectResponse);
								resolve(Object.assign({}, returnObject, { isSuccess: true }));
							} else {
								resolve({
									isSuccess: false,
									message: NganLuong.getReturnUrlStatus(objectResponse.error_code[0]),
								});
							}
						});
					} else {
						resolve({
							isSuccess: false,
							message: 'No response from nganluong server',
						});
					}
				})
				.catch(err => {
					reject(err);
				});
		});
	}

	_mapQueryToObject(query) {
		const returnObject = query;
		console.log(query);

		return returnObject;
	}

	static getReturnUrlStatus(responseCode, locale = 'vn') {
		const responseCodeTable = {
			'00': {
				vn: 'Giao dịch thành công',
				en: 'Approved',
			},
			'02': {
				vn: 'Địa chỉ IP của merchant gọi tới NganLuong.vn không được chấp nhận',
				en: 'Invalid IP Address',
			},
			'03': {
				vn: 'Sai tham số gửi tới NganLuong.vn (có tham số sai tên hoặc kiểu dữ liệu)',
				en: 'Sent data is not in the right format',
			},
			'04': {
				vn: 'Tên hàm API do merchant gọi tới không hợp lệ (không tồn tại)',
				en: 'API function name not found',
			},
			'05': {
				vn: 'Sai version của API',
				en: 'Wrong API version',
			},
			'06': {
				vn: 'Mã merchant không tồn tại hoặc chưa được kích hoạt',
				en: 'Merchant code not found or not activated yet',
			},
			'07': {
				vn: 'Sai mật khẩu của merchant',
				en: 'Wrong merchant password',
			},
			'08': {
				vn: 'Tài khoản người bán hàng không tồn tại',
				en: 'Seller account not found',
			},
			'09': {
				vn: 'Tài khoản người nhận tiền đang bị phong tỏa',
				en: 'Receiver account is frozen',
			},
			10: {
				vn: 'Hóa đơn thanh toán không hợp lệ',
				en: 'Invalid payment bill',
			},
			11: {
				vn: 'Số tiền thanh toán không hợp lệ',
				en: 'Invalid amount',
			},
			12: {
				vn: 'Đơn vị tiền tệ không hợp lệ',
				en: 'Invalid money currency',
			},
			29: {
				vn: 'Token không tồn tại',
				en: 'Token not found',
			},
			80: {
				vn: 'Không thêm được đơn hàng',
				en: "Can't add more order",
			},
			81: {
				vn: 'Đơn hàng chưa được thanh toán',
				en: 'The order has not yet been paid',
			},
			110: {
				vn: 'Địa chỉ email tài khoản nhận tiền không phải email chính',
				en: 'The email address is not the primary email',
			},
			111: {
				vn: 'Tài khoản nhận tiền đang bị khóa',
				en: 'Receiver account is locked',
			},
			113: {
				vn: 'Tài khoản nhận tiền chưa cấu hình là người bán nội dung số',
				en: 'Receiver account is not configured as digital content sellers',
			},
			114: {
				vn: 'Giao dịch đang thực hiện, chưa kết thúc',
				en: 'Pending transaction',
			},
			115: {
				vn: 'Giao dịch bị hủy',
				en: 'Cancelled transaction',
			},
			118: {
				vn: 'tax_amount không hợp lệ',
				en: 'Invalid tax_amount',
			},
			119: {
				vn: 'discount_amount không hợp lệ',
				en: 'Invalid discount_amount',
			},
			120: {
				vn: 'fee_shipping không hợp lệ',
				en: 'Invalid fee_shipping',
			},
			121: {
				vn: 'return_url không hợp lệ',
				en: 'Invalid return_url',
			},
			122: {
				vn: 'cancel_url không hợp lệ',
				en: 'Invalid cancel_url',
			},
			123: {
				vn: 'items không hợp lệ',
				en: 'Invalid items',
			},
			124: {
				vn: 'transaction_info không hợp lệ',
				en: 'Invalid transaction_info',
			},
			125: {
				vn: 'quantity không hợp lệ',
				en: 'Invalid quantity',
			},
			126: {
				vn: 'order_description không hợp lệ',
				en: 'Invalid order_description',
			},
			127: {
				vn: 'affiliate_code không hợp lệ',
				en: 'Invalid affiliate_code',
			},
			128: {
				vn: 'time_limit không hợp lệ',
				en: 'Invalid time_limit',
			},
			129: {
				vn: 'buyer_fullname không hợp lệ',
				en: 'Invalid buyer_fullname',
			},
			130: {
				vn: 'buyer_email không hợp lệ',
				en: 'Invalid buyer_email',
			},
			131: {
				vn: 'buyer_mobile không hợp lệ',
				en: 'Invalid buyer_mobile',
			},
			132: {
				vn: 'buyer_address không hợp lệ',
				en: 'Invalid buyer_address',
			},
			133: {
				vn: 'total_item không hợp lệ',
				en: 'Invalid total_item',
			},
			134: {
				vn: 'payment_method, bank_code không hợp lệ',
				en: 'Invalid payment_method, bank_code',
			},
			135: {
				vn: 'Lỗi kết nối tới hệ thống ngân hàng',
				en: 'Error connecting to banking system',
			},
			140: {
				vn: 'Đơn hàng không hỗ trợ thanh toán trả góp',
				en: 'The order does not support installment payments',
			},
			99: {
				vn: 'Lỗi không được định nghĩa hoặc không rõ nguyên nhân',
				en: 'Unknown error',
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
	clientIp             : { type: String, optional: true, max: 16 },
	currency             : { type: String, allowedValues: ['vnd', 'VND', 'USD', 'usd'] },
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
	returnUrl            : { type: String, max: 255 },
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
