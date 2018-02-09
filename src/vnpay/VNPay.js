/* © 2018 NauStud.io
 * @author Eric Tran
 */

import SimpleSchema from 'simpl-schema';
import { URL } from 'url';
import { vnPayDateFormat, createMd5Hash, toUpperCase } from '../utils';

/**
 * VNPay payment gateway helper
 * <br>
 * _Hàm hỗ trợ thanh toán qua VNPay_
 *
 * @example
 * import { VNPay } from 'vn-payments';
 *
 * const TEST_CONFIG = VNPay.TEST_CONFIG;
 *
 * const vnpayCheckout = new VNPay({
 * 	paymentGateway: TEST_CONFIG.paymentGateway,
 * 	merchant: TEST_CONFIG.merchant,
 * 	secureSecret: TEST_CONFIG.secureSecret,
 * });
 *
 * // checkoutUrl is an URL instance
 * const checkoutUrl = await vnpayCheckout.buildCheckoutUrl(params);
 *
 * this.response.writeHead(301, { Location: checkoutUrl.href });
 * this.response.end();
 */
class VNPay {
	/**
	 * Instantiate a VNPay checkout helper
	 * <br>
	 * _Khởi tạo hàm thanh toán VNPay_
	 * @param  {Object} config check VNPay.configSchema for data type requirements <br> _Xem VNPay.configSchema để biết yêu cầu kiểu dữ liệu_
	 * @return {void}
	 */
	constructor(config) {
		this.config = Object.assign({}, config);
		// check type validity
		VNPay.configSchema.validate(this.config);
	}

	/**
	 * Build checkoutUrl to redirect to the payment gateway
	 * <br>
	 * _Hàm xây dựng url để redirect qua VNPay gateway, trong đó có tham số mã hóa (còn gọi là public key)_
	 *
	 * @param  {VNPayCheckoutPayload} payload Object that contains needed data for the URL builder, refer to typeCheck object above <br> _Đối tượng chứa các dữ liệu cần thiết để thiết lập đường dẫn._
	 * @return {Promise<URL>} buildCheckoutUrl promise
	 */
	buildCheckoutUrl(payload) {
		return new Promise((resolve, reject) => {
			// Mảng các tham số chuyển tới VNPay Payment
			const data = Object.assign({}, this.checkoutPayloadDefaults, payload);
			const config = this.config;

			data.vnpSecretKey = config.secureSecret;
			data.vnpMerchant = config.merchant;

			// Input type checking
			try {
				this.validateCheckoutPayload(data);
			} catch (error) {
				reject(error.message);
			}

			// convert amount to VNPay format (100 = 1VND):
			data.amount = Math.floor(data.amount * 100);

			/* prettier-ignore */
			const arrParam = {
				vnp_Version        : data.vnpVersion,
				vnp_Command        : data.vnpCommand,
				vnp_TmnCode        : data.vnpMerchant,
				vnp_Locale         : data.locale,
				vnp_BankCode       : data.bankCode,
				vnp_CurrCode       : data.currency,
				vnp_TxnRef         : data.orderId,
				vnp_OrderInfo      : data.orderInfo,
				vnp_OrderType      : data.orderType,
				vnp_Amount         : String(data.amount),
				vnp_ReturnUrl      : data.returnUrl,
				vnp_IpAddr         : data.clientIp,
				vnp_CreateDate     : data.createdDate || vnPayDateFormat(new Date()),
			};

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

			resolve(redirectUrl);
		});
	}

	/**
	 * Validate checkout payload against specific schema. Throw ValidationErrors if invalid against checkoutSchema
	 * <br>
	 * _Kiểm tra tính hợp lệ của dữ liệu thanh toán dựa trên một cấu trúc dữ liệu cụ thể. Hiển thị lỗi nếu không hợp lệ với checkoutSchema._
	 *
	 * @param {VNPayCheckoutPayload} payload
	 */
	validateCheckoutPayload(payload) {
		VNPay.checkoutSchema.validate(payload);
	}

	/**
	 * Return default checkout Payloads
	 *
	 * _Lấy checkout payload mặc định cho cổng thanh toán này_
	 * @return {VNPayCheckoutPayload} default payload object <br> _Dữ liệu mặc định của đối tượng_
	 */
	get checkoutPayloadDefaults() {
		/* prettier-ignore */
		return {
			currency             : VNPay.CURRENCY_VND,
			locale               : VNPay.LOCALE_VN,
			vnpVersion           : VNPay.VERSION,
			vnpCommand 			 : VNPay.COMMAND,
		};
	}

	/**
	 * @typedef {Object} VNPayReturnObject
	 * @property {boolean} isSuccess whether the payment succeeded or not
	 * @property {string} message Approve or error message based on response code
	 * @property {string} merchant merchant ID, should be same with checkout request
	 * @property {string} transactionId merchant's transaction ID, should be same with checkout request
	 * @property {number} amount amount paid by customer, already divided by 100
	 * @property {string} orderInfo order info, should be same with checkout request
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
	 * Verify return query string from VNPay using enclosed vnp_SecureHash string
	 * <br>
	 * _Hàm thực hiện xác minh tính đúng đắn của các tham số trả về từ vnpay Payment_
	 *
	 * @param  {Object} query Query data object from GET handler (`response.query`) <br> _Dữ liệu được trả về từ GET handler (`response.query`)_
	 * @return {Promise<VNPayReturnObject>}  Promise object which resolved with normalized returned data object, with additional fields like isSuccess. <br> _Promise khi hoàn thành sẽ trả về object data từ cổng thanh toán, được chuẩn hóa tên theo camelCase và đính kèm thuộc tính isSuccess_
	 */
	verifyReturnUrl(query) {
		return new Promise(resolve => {
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

			resolve(Object.assign(returnObject, query, verifyResults));
		});
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
			message: VNPay.getReturnUrlStatus(query.vnp_ResponseCode), // no message from gateway, we'll look it up on our side
		};

		return returnObject;
	}

	/**
	 * Get known response code status
	 * <br>
	 * _Lấy chuỗi trạng thái từ response code đã biết_
	 * @param {*} responseCode Responde code from gateway <br> _Mã trả về từ cổng thanh toán_
	 * @param {*} locale Same locale at the buildCheckoutUrl. Note, 'vn' for Vietnamese <br> _Cùng nơi với hàm buildCheckoutUrl. Lưu ý, 'vn' là Việt Nam_
	 *  @return {string}  A string contains error status converted from response code <br> _Một chuỗi chứa trạng thái lỗi được chuyển lại từ response code_
	 */
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

/**
 * @typedef {Object} VNPayCheckoutPayload
 * @property {string} createdDate  optional: true
 * @property {number} amount The pay amount, Integer, max: 9999999999
 * @property {string} clientIp  max: 16
 * @property {string} currency  allowedValues: ['VND']
 * @property {string} billingCity  optional: true, max: 255
 * @property {string} billingCountry  optional: true, max: 255
 * @property {string} billingPostCode  optional: true, max: 255
 * @property {string} billingStateProvince  optional: true, max: 255
 * @property {string} billingStreet  optional: true, max: 255
 * @property {string} customerEmail  optional: true, max: 255, regEx: SimpleSchema.RegEx.Email
 * @property {string} customerId  optional: true, max: 255
 * @property {string} customerPhone  optional: true, max: 255
 * @property {string} deliveryAddress  optional: true, max: 255
 * @property {string} deliveryCity  optional: true, max: 255
 * @property {string} deliveryCountry  optional: true, max: 255
 * @property {string} deliveryProvince  optional: true, max: 255
 * @property {string} bankCode  optional: true, max: 50
 * @property {string} locale  allowedValues: ['vn', 'en']
 * @property {string} orderId  max: 34
 * @property {string} orderInfo  max: 255
 * @property {string} orderType  max: 40
 * @property {string} returnUrl  max: 255
 * @property {string} transactionId  max: 40
 * @property {string} vnpSecretKey  max: 32
 * @property {string} vnpMerchant  max: 16
 * @property {string} vnpCommand  max: 16
 * @property {string} vnpVersion  max: 2
 * @property {string} paymentGateway  regEx: SimpleSchema.RegEx.Url
 * @property {string} merchant
 * @property {string} secureSecret
 */

/* prettier-ignore */
/**
 * The schema is based on field data requirements from VNPay's dev document
 * <br>
 * _Cấu trúc dữ liệu được dựa trên các yêu cầu của tài liệu VNPay_
 * @type {SimpleSchema}
 */
VNPay.checkoutSchema = new SimpleSchema({
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

/**
 * VNPay configSchema
 * @type {SimpleSchema}
 */
VNPay.configSchema = new SimpleSchema({
	paymentGateway: { type: String, regEx: SimpleSchema.RegEx.Url },
	merchant: { type: String },
	secureSecret: { type: String },
});
// should not be changed
VNPay.VERSION = '2';
VNPay.COMMAND = 'pay';
// vnpay only support VND
VNPay.CURRENCY_VND = 'VND';
VNPay.LOCALE_EN = 'en';
VNPay.LOCALE_VN = 'vn';

VNPay.TEST_CONFIG = {
	paymentGateway: 'http://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
	merchant: 'COCOSIN',
	secureSecret: 'RAOEXHYVSDDIIENYWSLDIIZTANXUXZFJ',
};

export { VNPay };
