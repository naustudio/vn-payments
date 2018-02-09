/* © 2018 NauStud.io
 * @author Tu Nguyen
 */

import SimpleSchema from 'simpl-schema';
import { URL } from 'url';
import { toUpperCase, hashHmac, pack } from '../utils';

/**
 * SohaPay payment gateway helper.
 * <br>
 * NOTE: Our test card deprecated, so we couldn't test this gateway thoroughly.
 * <br>
 * _Hàm hỗ trợ thanh toán qua SohaPay_
 *<br>
 * _Lưu ý: Thẻ thanh toán dùng thử của chúng tôi đã hết được hỗ trợ nên chúng tôi không thể kiểm tra hoàn toàn cổng thanh toán này_
 *
 * @example
 * import { SohaPay } from 'vn-payments';
 *
 * const TEST_CONFIG = SohaPay.TEST_CONFIG;
 *
 * const sohapayCheckout = new SohaPay({
 * 	paymentGateway: TEST_CONFIG.paymentGateway,
 * 	merchant: TEST_CONFIG.merchant,
 *  receiverEmail: TEST_CONFIG.receiverEmail,
 * 	secureSecret: TEST_CONFIG.secureSecret,
 * });
 *
 * // checkoutUrl is an URL instance
 * const checkoutUrl = await sohapayCheckout.buildCheckoutUrl(params);
 *
 * this.response.writeHead(301, { Location: checkoutUrl.href });
 * this.response.end();
 */
class SohaPay {
	/**
	 * Instantiate a SohaPay checkout helper
	 * <br>
	 * _Khởi tạo hàm thanh toán SohaPay_
	 *
	 * @param  {Object} config check SohaPay.configSchema for data type requirements <br> _Xem SohaPay.configSchema để biết yêu cầu kiểu dữ liệu_
	 * @return {void}
	 */
	constructor(config = {}) {
		this.config = Object.assign({}, config);
		SohaPay.configSchema.validate(this.config);
	}

	/**
	 * Build checkout URL to redirect to the payment gateway
	 * <br>
	 * _Hàm xây dựng url để redirect qua Soha gateway, trong đó có tham số mã hóa (còn gọi là public key)_
	 * @param  {SohaPayCheckoutPayload} payload Object that contains needed data for the URL builder <br> _Đối tượng chứa các dữ liệu cần thiết để thiết lập đường dẫn._
	 * @return {Promise<URL>}    The URL object used to redirect <br> _Đối tượng URL dùng để chuyển trang qua cổng thanh toán_
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
	 * <br>
	 * _Kiểm tra tính hợp lệ của dữ liệu thanh toán dựa trên một cấu trúc dữ liệu cụ thể. Hiển thị lỗi nếu không hợp lệ._
	 * @param {SohaPayCheckoutPayload} payload
	 */
	validateCheckoutPayload(payload) {
		SohaPay.checkoutSchema.validate(payload);
	}

	/**
	 * Return default checkout Payloads
	 *
	 * _Lấy checkout payload mặc định cho cổng thanh toán này_
	 * @return {SohaPayCheckoutPayload} default payload object <br> _Dữ liệu mặc định của đối tượng_
	 */
	get checkoutPayloadDefaults() {
		/* prettier-ignore */
		return {
			language             : SohaPay.LOCALE_VN,
			version           	 : SohaPay.VERSION,
		};
	}

	/**
	 * @typedef {Object} SohaPayReturnObject
	 * @property {boolean} isSuccess whether the payment succeeded or not
	 * @property {string} message returned from SohaPay
	 * @property {string} transactionId transaction id
	 * @property {string} orderEmail customer email
	 * @property {string} orderSession session token came from SohaPay
	 * @property {string} amount amount paid by customer
	 * @property {string} siteCode unique code assigned by SohaPay for merchant
	 * @property {string} responseCode response status code of SohaPay
	 * @property {string} transactionInfo description of the payment
	 * @property {string} responseMessage response message from SohaPay
	 * @property {string} secureCode checksum of the returned data, used to verify data integrity
	 *
	 *
	 * @property {string} error_text e.g: 'Giao dịch thanh toán bị huỷ bỏ'
	 * @property {string} order_code e.g: 'node-2018-01-19T131933.811Z'
	 * @property {string} order_email e.g: 'tu.nguyen@naustud.io'
	 * @property {string} order_session e.g: 'd3bdef93fa01cd37f7e426fa25f5d1a0'
	 * @property {string} price e.g: '90000'
	 * @property {string} site_code e.g: 'test'
	 * @property {string} transaction_info e.g: 'Thanh toan giay adidas'
	 * @property {string} secure_code e.g: FC5283C6B93C1D8F9A9329293DA38FFC3204FA6CE75661972419DAA6E5A1B7B5
	 *
	 */
	/**
	 *
	 * Verify return query string from SohaPay using enclosed secureCode string
	 * <br>
	 * _Hàm thực hiện xác minh tính đúng đắn của các tham số trả về từ SohaPay Payment_
	 *
	 * @param  {Object} query Query data object from GET handler (`response.query`)  <br> _Dữ liệu được trả về từ GET handler (`response.query`)_
	 * @return {Promise<SohaPayReturnObject>} Promise object which resolved with normalized returned data object, with additional fields like isSuccess. <br> _Promise khi hoàn thành sẽ trả về object data từ cổng thanh toán, được chuẩn hóa tên theo camelCase và đính kèm thuộc tính isSuccess_
	 */
	verifyReturnUrl(query) {
		return new Promise(resolve => {
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

				const isEqual =
					toUpperCase(secureHash) === toUpperCase(hashHmac('SHA256', secureCode.join('&'), pack(config.secureSecret)));

				if (!isEqual) {
					verifyResults.isSuccess = false;
					verifyResults.message = 'Wrong checksum';
				} else if (data.error_text) {
					verifyResults.isSuccess = false;
					verifyResults.message = returnObject.errorMessage;
				} else {
					verifyResults.message = returnObject.responseMessage;
					verifyResults.isSuccess = returnObject.responseCode === '0';
				}
			}

			resolve(Object.assign(returnObject, query, verifyResults));
		});
	}

	_mapQueryToObject(query) {
		const returnObject = {
			errorMessage: query.error_text,
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

/**
 * SohaPay configSchema
 * @type {SimpleSchema}
 */
SohaPay.configSchema = new SimpleSchema({
	merchantCode: { type: String },
	paymentGateway: { type: String },
	secureSecret: { type: String },
});

/**
 * @typedef {Object} SohaPayCheckoutPayload
 * @property {string} merchantCode
 * @property {string} paymentGateway
 * @property {string} secureSecret
 * @property {string} language  max: 16
 * @property {string} orderId  max: 34
 * @property {string} customerEmail  max: 24, regEx: SimpleSchema.RegEx.Email
 * @property {string} customerPhone  max: 15
 * @property {string} returnUrl  max: 255
 * @property {number} amount Integer, max: 9999999999
 * @property {string} paymentType  max: 1
 * @property {string} siteCode  max: 8
 * @property {string} transactionInfo  max: 255
 * @property {string} version  max: 1
 * @property {string} locale  optional: true, max: 2
 * @property {string} currency  optional: true, max: 4
 * @property {string} billingCity  optional: true, max: 64
 * @property {string} billingCountry  optional: true, max: 2
 * @property {string} billingPostCode  optional: true, max: 64
 * @property {string} billingStateProvince  optional: true, max: 64
 * @property {string} billingStreet  optional: true, max: 64
 * @property {string} deliveryAddress  optional: true, max: 255
 * @property {string} deliveryCity  optional: true, max: 255
 * @property {string} deliveryCountry  optional: true, max: 255
 * @property {string} deliveryProvince  optional: true, max: 255
 * @property {string} clientIp  optional: true, max: 15
 * @property {string} transactionId  optional: true, max: 40
 * @property {string} customerId  optional: true, max: 255
 */

/* prettier-ignore */
/**
 * SohaPay checkoutSchema
 * @type {SimpleSchema}
 */
SohaPay.checkoutSchema = new SimpleSchema({
	language				: { type: String, max: 16 },
	orderId					: { type: String, max: 34 },
	customerEmail			: { type: String, max: 24, regEx: SimpleSchema.RegEx.Email },
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

SohaPay.LOCALE_VN = 'vi';
SohaPay.LOCALE_EN = 'en';
SohaPay.VERSION = '2';

/**
 * SohaPay test configs
 * <br>
 * _Cấu hình dùng thử SohaPay_
 */
SohaPay.TEST_CONFIG = {
	merchantCode: 'test',
	paymentGateway: 'https://sohapay.vn/payment.php',
	secureSecret: '1234567890',
};

export { SohaPay };
