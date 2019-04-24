/* © 2018 NauStud.io
 * @author Eric Tran
 */

import SimpleSchema from 'simpl-schema';
import fetch from 'node-fetch';
import { parseString } from 'xml2js';
import { createMd5Hash } from '../utils';

/**
 * NganLuong payment gateway helper
 * <br>
 * _Hàm hỗ trợ thanh toán qua Ngân Lượng_
 *
 * @example
 * import { NganLuong } from 'vn-payments';
 *
 * const TEST_CONFIG = NganLuong.TEST_CONFIG;
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
 */
class NganLuong {
	/**
	 * Instantiate a NganLuong checkout helper
	 * <br>
	 * _Khởi tạo hàm thanh toán NganLuong_
	 *
	 * @param  {Object} config check NganLuong.configSchema for data type requirements <br> _Xem NganLuong.configSchema để biết yêu cầu kiểu dữ liệu_
	 * @return {void}
	 */
	constructor(config) {
		this.config = Object.assign({}, config);
		// check type validity
		NganLuong.configSchema.validate(this.config);
	}

	/**
	 * Build checkoutUrl to redirect to the payment gateway
	 * <br>
	 * _Hàm xây dựng url để redirect qua NganLuong gateway, trong đó có tham số mã hóa (còn gọi là public key)_
	 *
	 * @param  {NganLuongCheckoutPayload} payload Object that contains needed data for the URL builder, refer to typeCheck object above <br> _Đối tượng chứa các dữ liệu cần thiết để thiết lập đường dẫn._
	 * @return {Promise<URL>} buildCheckoutUrl promise
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
				function               : data.nganluongCommand,
				cur_code               : data.currency ? data.currency.toLowerCase() : 'vnd',
				version                : data.nganluongVersion,
				merchant_id            : data.nganluongMerchant,
				receiver_email         : data.receiverEmail,
				merchant_password      : createMd5Hash(data.nganluongSecretKey),
				order_code             : data.orderId,
				total_amount           : String(data.amount),
				payment_method         : data.paymentMethod,
				bank_code              : data.bankCode,
				payment_type           : data.paymentType,
				order_description      : data.orderInfo,
				tax_amount             : data.taxAmount,
				fee_shipping           : data.feeShipping || '0',
				discount_amount        : data.discountAmount || '0',
				return_url             : data.returnUrl,
				cancel_url             : data.cancelUrl,
				buyer_fullname         : data.customerName,
				buyer_email            : data.customerEmail,
				buyer_mobile           : data.customerPhone,
				buyer_address          : data.billingStreet,
				time_limit             : data.timeLimit,
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
				});
		});
	}

	/**
	 * Validate checkout payload against specific schema. Throw ValidationErrors if invalid against checkoutSchema
	 * <br>
	 * _Kiểm tra tính hợp lệ của dữ liệu thanh toán dựa trên một cấu trúc dữ liệu cụ thể. Hiển thị lỗi nếu không hợp lệ với checkoutSchema._
	 *
	 * @param {NganLuongCheckoutPayload} payload
	 */
	validateCheckoutPayload(payload) {
		NganLuong.checkoutSchema.validate(payload);
	}

	/**
	 * Return default checkout Payloads
	 *
	 * _Lấy checkout payload mặc định cho cổng thanh toán này_
	 * @return {NganLuongCheckoutPayload} default payload object <br> _Dữ liệu mặc định của đối tượng_
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
	 * @typedef {Object} NganLuongReturnObject
	 * @property {boolean} isSuccess whether the payment succeeded or not
	 * @property {string} message Approve or error message based on response code
	 * @property {string} merchant merchant ID, should be same with checkout request
	 * @property {string} transactionId merchant's transaction ID, should be same with checkout request
	 * @property {string} amount amount paid by customer
	 * @property {string} orderInfo order info, should be same with checkout request
	 * @property {string} responseCode response code, payment has errors if it is non-zero
	 * @property {string} bankCode bank code of the bank where payment was occurred
	 * @property {string} gatewayTransactionNo Gateway's own transaction ID, used to look up at Gateway's side
	 *
	 * @property {string} error_code e.g: '00'
	 * @property {string} token e.g: '43614-fc2a3698ee92604d5000434ed129d6a8'
	 * @property {string} description e.g: ''
	 * @property {string} transaction_status e.g: '00'
	 * @property {string} receiver_email e.g: 'tung.tran@naustud.io'
	 * @property {string} order_code e.g: 'adidas'
	 * @property {string} total_amount e.g: '90000'
	 * @property {string} payment_method e.g: 'ATM_ONLINE'
	 * @property {string} bank_code e.g: 'BAB'
	 * @property {string} payment_type e.g: '2'
	 * @property {string} order_description e.g: 'Test'
	 * @property {string} tax_amount e.g: '0'
	 * @property {string} discount_amount e.g: '0'
	 * @property {string} fee_shipping e.g: '0'
	 * @property {string} return_url e.g: 'http%3A%2F%2Flocalhost%3A8080%2Fpayment%2Fnganluong%2Fcallback'
	 * @property {string} cancel_url e.g: 'http%3A%2F%2Flocalhost%3A8080%2F'
	 * @property {string} buyer_fullname e.g: 'Nguyen Hue'
	 * @property {string} buyer_email e.g: 'tu.nguyen@naustud.io'
	 * @property {string} buyer_mobile e.g: '0948231723'
	 * @property {string} buyer_address e.g: 'TEst'
	 * @property {string} affiliate_code e.g: ''
	 * @property {string} transaction_id e.g: '19563733'
	 */
	/**
	 * Verify return query string from NganLuong using enclosed vnp_SecureHash string
	 *<br>
	 * _Hàm thực hiện xác minh tính đúng đắn của các tham số trả về từ nganluong Payment_
	 *
	 * @param  {Object} query Query data object from GET handler (`response.query`) <br> _Dữ liệu được trả về từ GET handler (`response.query`)_
	 * @return {Promise<NganLuongReturnObject>} Promise object which resolved with normalized returned data object, with additional fields like isSuccess. <br> _Promise khi hoàn thành sẽ trả về object data từ cổng thanh toán, được chuẩn hóa tên theo camelCase và đính kèm thuộc tính isSuccess_
	 */
	verifyReturnUrl(query) {
		return new Promise(resolve => {
			const data = {};
			const config = this.config;
			const token = query.token || query.token_nl;
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
				token,
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
					parseString(rs, (err, result) => {
						const objectResponse = result.result || {};
						if (objectResponse.error_code[0] === '00') {
							objectResponse.merchant = data.nganluongMerchant;
							const returnObject = this._mapQueryToObject(objectResponse);
							resolve(Object.assign({}, returnObject, { isSuccess: true }));
						} else {
							resolve({
								isSuccess: false,
								message: objectResponse.description || NganLuong.getReturnUrlStatus(objectResponse.error_code[0]),
							});
						}
					});
				});
		});
	}

	_mapQueryToObject(query) {
		const returnObject = {};
		Object.keys(query).forEach(key => {
			returnObject[key] = query[key][0];
		});

		return Object.assign({}, returnObject, {
			merchant: returnObject.merchant,
			transactionId: returnObject.order_code,
			amount: returnObject.total_amount,
			orderInfo: returnObject.order_description,
			responseCode: returnObject.transaction_status,
			bankCode: returnObject.bank_code,
			gatewayTransactionNo: returnObject.transaction_id,
			message: returnObject.description || NganLuong.getReturnUrlStatus(returnObject.error_code),
			customerEmail: returnObject.buyer_email,
			customerPhone: returnObject.buyer_mobile,
			customerName: returnObject.buyer_fullname,
		});
	}

	/**
	 * Get known response code status
	 * <br>
	 * _Lấy chuỗi trạng thái từ response code đã biết_
	 * @param  {string} responseCode Response code from gateway <br> _Mã trả về từ cổng thanh toán_
	 * @param  {string} locale       Same locale at the buildCheckoutUrl. Note, 'vn' for Vietnamese <br> _Cùng nơi với hàm buildCheckoutUrl. Lưu ý, 'vn' là Việt Nam_
	 * @return {string}              A string contains error status converted from response code <br> _Một chuỗi chứa trạng thái lỗi được chuyển lại từ response code_
	 */
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

/**
 * @typedef {Object} NganLuongCheckoutPayload
 * @property {string} createdDate  optional: true
 * @property {number} amount The payment mount
 * @property {string} clientIp  optional: true, max: 16
 * @property {string} currency  allowedValues: ['vnd', 'VND', 'USD', 'usd']
 * @property {string} billingCity  optional: true, max: 255
 * @property {string} billingCountry  optional: true, max: 255
 * @property {string} billingPostCode  optional: true, max: 255
 * @property {string} billingStateProvince  optional: true, max: 255
 * @property {string} billingStreet  optional: true, max: 255
 * @property {string} customerId  optional: true, max: 255
 * @property {string} deliveryAddress  optional: true, max: 255
 * @property {string} deliveryCity  optional: true, max: 255
 * @property {string} deliveryCountry  optional: true, max: 255
 * @property {string} deliveryProvince  optional: true, max: 255
 * @property {string} locale  allowedValues: ['vi', 'en']
 * @property {string} orderId  max: 34
 * @property {string} receiverEmail  max: 255, regEx: SimpleSchema.RegEx.Email
 * @property {string} paymentMethod  allowedValues: ['NL', 'VISA', 'MASTER', 'JCB', 'ATM_ONLINE', 'ATM_OFFLINE', 'NH_OFFLINE', 'TTVP', 'CREDIT_CARD_PREPAID', 'IB_ONLINE']
 * @property {string} bankCode  optional: true, max: 50 (required with method ATM_ONLINE, ATM_OFFLINE, NH_OFFLINE, CREDIT_CARD_PREPAID)
 * @property {string} paymentType  optional: true, allowedValues: ['1', '2']
 * @property {string} orderInfo  optional: true, max: 500
 * @property {number} taxAmount Integer, optional: true
 * @property {number} discountAmount Integer, optional: true
 * @property {number} feeShipping Integer, optional: true
 * @property {string} customerEmail  max: 255, regEx: SimpleSchema.RegEx.Email
 * @property {string} customerPhone  max: 255
 * @property {string} customerName  max: 255
 * @property {string} returnUrl  max: 255
 * @property {string} cancelUrl  max: 255, optional: true
 * @property {number} timeLimit Integer, optional: true; minu
 * @property {string} affiliateCode  max: 255, optional: true
 * @property {string} totalItem  optional: true
 * @property {string} transactionId  max: 40
 * @property {string} nganluongSecretKey  max: 32
 * @property {string} nganluongMerchant  max: 16
 * @property {string} nganluongCommand  max: 32
 * @property {string} nganluongVersion  max: 3
 * @property {string} paymentGateway  regEx: SimpleSchema.RegEx.Url
 * @property {string} merchant
 * @property {string} receiverEmail
 * @property {string} secureSecret
 */
/* prettier-ignore */
/**
 * The schema is based on field data requirements from NganLuong's dev document
 * <br>
 * _Cấu trúc dữ liệu được dựa trên các yêu cầu của tài liệu Ngân Lượng_
 * @type {SimpleSchema}
 */
NganLuong.checkoutSchema = new SimpleSchema({
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
	paymentMethod        : { type: String, allowedValues: ['NL', 'VISA', 'MASTER', 'JCB', 'ATM_ONLINE', 'ATM_OFFLINE', 'NH_OFFLINE', 'TTVP', 'CREDIT_CARD_PREPAID', 'IB_ONLINE'] },
	bankCode             : {
		type: String,
		optional: true,
		max: 50,
		custom() {
			let shouldBeRequired = false;
			const method = this.field('paymentMethod').value;
			if (['ATM_ONLINE', 'ATM_OFFLINE', 'NH_OFFLINE', 'CREDIT_CARD_PREPAID'].indexOf(method) > -1) {
				shouldBeRequired = true;
			}

			if (shouldBeRequired && (this.value == null || this.value === '')) {
				return SimpleSchema.ErrorTypes.REQUIRED;
			}

			// field is valid
			return undefined;
		},
	},
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

/**
 * NganLuong test configs
 * <br>
 * _Cấu hình dùng thử Ngân Lượng_
 */
NganLuong.TEST_CONFIG = {
	paymentGateway: 'https://sandbox.nganluong.vn:8088/nl35/checkout.api.nganluong.post.php',
	merchant: '45571',
	receiverEmail: 'tung.tran@naustud.io',
	secureSecret: 'c57700e78cb0df1766279d91e3233c79',
};

export { NganLuong };
