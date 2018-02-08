/* © 2018 NauStud.io
 * @author Jacob Pham, Thanh Tran
 */
import { URL } from 'url';
import SimpleSchema from 'simpl-schema';
import { toUpperCase, pack, hashHmac } from '../utils';

/**
 * This is the base class for OnePay's domestic and intl payment gateways
 * which bear the common hashing algorithym.
 * <br>
 * It should not be used alone.
 * <br>
 * _Đây là lớp cơ sở cho lớp OnePayDomestic và lớp OnePayInternational.
 * Lớp này chứa các thuật toán mã hóa chung._
 * <br>
 * _Lớp này không nên được sử dụng để khai báo._
 * @private
 */
class OnePay {
	/**
	 * Instantiate a OnePay checkout helper
	 * <br>
	 * _Khởi tạo class thanh toán OnePay_
	 *
	 * @param  {Object} config check OnePay.configSchema for data type requirements. <br> _Xem OnePay.configSchema để biết yêu cầu kiểu dữ liệu._
	 * @return {void}
	 */
	constructor(config = {}, type = 'domestic') {
		this.config = config;
		this.type = type; // 'domestic' or 'international'
		// check config validity and throw errors if any
		OnePay.configSchema.validate(this.config);
	}

	/**
	 * Build checkout URL to redirect to the payment gateway.
	 * <br>
	 * _Hàm xây dựng url để redirect qua OnePay gateway, trong đó có tham số mã hóa (còn gọi là public key)._
	 *
	 * @param  {OnePayCheckoutPayload} payload Object that contains needed data for the URL builder, refer to typeCheck object above. <br> _Đối tượng chứa các dữ liệu cần thiết để thiết lập đường dẫn._
	 * @return {Promise<URL>} buildCheckoutUrl promise
	 */
	buildCheckoutUrl(payload) {
		return new Promise((resolve, reject) => {
			// Mảng các tham số chuyển tới Onepay Payment
			const data = Object.assign({}, this.checkoutPayloadDefaults, payload);
			const config = this.config;

			data.vpcMerchant = config.merchant;
			data.vpcAccessCode = config.accessCode;

			// Input type checking, define the schema and use it in subclass
			try {
				this.validateCheckoutPayload(data);
			} catch (error) {
				reject(error.message);
			}

			// convert amount to OnePay format (100 = 1VND):
			data.amount = Math.floor(data.amount * 100);

			// IMPORTANT: the keys' order must be exactly like below
			// Note: we can also sort the keys alphabetically like in PHP, but by listing the keys
			// in fixed order, we don't worry about missmatch checksum hashing
			/* prettier-ignore */
			const arrParam = {
				AVS_City: data.billingCity,
				AVS_Country: data.billingCountry,
				AVS_PostCode: data.billingPostCode,
				AVS_StateProv: data.billingStateProvince,
				AVS_Street01: data.billingStreet,
				AgainLink: data.againLink,
				Title: data.title,
				vpc_AccessCode: data.vpcAccessCode,
				vpc_Amount: String(data.amount),
				vpc_Command: data.vpcCommand,
				vpc_Currency: data.currency,
				vpc_Customer_Email: data.customerEmail,
				vpc_Customer_Id: data.customerId,
				vpc_Customer_Phone: data.customerPhone,
				vpc_Locale: data.locale,
				vpc_MerchTxnRef: data.transactionId,
				vpc_Merchant: data.vpcMerchant,
				vpc_OrderInfo: data.orderId,
				vpc_ReturnURL: data.returnUrl,
				vpc_SHIP_City: data.deliveryCity,
				vpc_SHIP_Country: data.deliveryCountry,
				vpc_SHIP_Provice: data.deliveryProvince, // NOTE: vpc_SHIP_Provice is exact in the sepcs document
				vpc_SHIP_Street01: data.deliveryAddress,
				vpc_TicketNo: data.clientIp,
				vpc_Version: data.vpcVersion,
			};

			if (this.type === 'international') {
				// special case: Intl gateway don't checksum **vps_Currency**, so we have to delete it from params :(
				delete arrParam.vpc_Currency;
			}

			// Step 2. Create the target redirect URL at OnePay server
			const redirectUrl = new URL(config.paymentGateway);
			const secureCode = [];

			Object.keys(arrParam).forEach(key => {
				const value = arrParam[key];

				if (value == null || value.length === 0) {
					// skip empty params (but they must be optional)
					return;
				}

				redirectUrl.searchParams.append(key, value); // no need to encode URI with URLSearchParams object

				if (value.length > 0 && (key.substr(0, 4) === 'vpc_' || key.substr(0, 5) === 'user_')) {
					// secureCode is digested from vpc_* params but they should not be URI encoded
					secureCode.push(`${key}=${value}`);
				}
			});

			/* Step 3. calculate the param checksum with hash_hmac*/
			// console.log('secureCode:', secureCode.join('&'));
			if (secureCode.length > 0) {
				redirectUrl.searchParams.append(
					'vpc_SecureHash',
					toUpperCase(hashHmac('SHA256', secureCode.join('&'), pack(config.secureSecret)))
				);
			}

			// console.log('redirectUrl:', redirectUrl);

			resolve(redirectUrl);
		});
	}

	/**
	 * Validate checkout payload against specific schema. Throw ValidationErrors if invalid against checkoutSchema
	 * <br>
	 * Build the schema in subclass.
	 * <br>
	 * _Kiểm tra tính hợp lệ của dữ liệu thanh toán dựa trên schema đã được đồng bộ với tài liệu của nhà cung cấp.
	 * Hiển thị lỗi nếu không hợp lệ với checkoutSchema._
	 * <br>
	 * _Schema sẽ được tạo trong class con._
	 * @param {OnePayCheckoutPayload} payload
	 */
	validateCheckoutPayload(/*payload*/) {
		throw new Error('validateCheckoutPayload() requires overloading');
	}

	/**
	 * Return default checkout Payloads
	 *
	 * _Lấy checkout payload mặc định cho cổng thanh toán này_
	 * @return {OnePayCheckoutPayload} default payloads
	 */
	get checkoutPayloadDefaults() {
		return {};
	}

	/**
	 * Verify return query string from OnePay using enclosed vpc_SecureHash string
	 *
	 * _Hàm thực hiện xác minh tính đúng đắn của các tham số trả về từ cổng thanh toán_
	 *
	 * @param  {Object} query Query data object from GET handler (`response.query`). <br> _Object query trả về từ GET handler_
	 * @return {Promise<Object>} Promise object which resolved with normalized returned data object, with additional fields like isSuccess. <br> _Promise khi hoàn thành sẽ trả về object data từ cổng thanh toán, được chuẩn hóa tên theo camelCase và đính kèm thuộc tính isSuccess_
	 */
	verifyReturnUrl(query) {
		return new Promise(resolve => {
			const data = Object.assign({}, query);
			const config = this.config;
			const vpcTxnSecureHash = data.vpc_SecureHash;
			delete data.vpc_SecureHash;

			if (
				config.secureSecret.length > 0 &&
				data.vpc_TxnResponseCode !== '7' &&
				data.vpc_TxnResponseCode !== 'No Value Returned'
			) {
				const secureCode = [];

				Object.keys(data)
					.sort() // need to sort the key by alphabetically
					.forEach(key => {
						const value = data[key];

						if (value.length > 0 && (key.substr(0, 4) === 'vpc_' || key.substr(0, 5) === 'user_')) {
							secureCode.push(`${key}=${value}`);
						}
					});

				if (
					toUpperCase(vpcTxnSecureHash) ===
					toUpperCase(hashHmac('SHA256', secureCode.join('&'), pack(config.secureSecret)))
				) {
					// for the transaction to succeed, its checksum must be valid, then response code must be '0'
					resolve({ isSuccess: data.vpc_TxnResponseCode === '0' });
				}
			}

			// this message prop will override whatever in Subclass
			resolve({ isSuccess: false, message: 'Wrong checksum' });
		});
	}
}

/**
 * OnePay checkout payload object, with normalized field names and validation rules based on OnePay's dev document
 *
 * _Object chuyển dữ liệu thanh toán cho OnePay, đã được chuẩn hóa tên biến và sẽ được kiểm _
 *
 * @typedef {Object} OnePayCheckoutPayload
 * @property {string} againLink optional: true, max: 64, regEx: urlRegExp
 * @property {number} amount max: 9999999999
 * @property {string} billingCity optional: true, max: 64
 * @property {string} billingCountry optional: true, max: 2
 * @property {string} billingPostCode optional: true, max: 64
 * @property {string} billingStateProvince optional: true, max: 64
 * @property {string} billingStreet optional: true, max: 64
 * @property {string} clientIp max: 15
 * @property {string} currency allowedValues: ['VND']
 * @property {string} customerEmail optional: true, max: 24, regEx: SimpleSchema.RegEx.Email
 * @property {string} customerId optional: true, max: 64
 * @property {string} customerPhone optional: true, max: 16
 * @property {string} deliveryAddress optional: true, max: 64
 * @property {string} deliveryCity optional: true, max: 64
 * @property {string} deliveryCountry optional: true, max: 8
 * @property {string} deliveryProvince optional: true, max: 64
 * @property {string} locale allowedValues: ['vn', 'en']
 * @property {string} orderId max: 32
 * @property {string} returnUrl max: 255, regEx: urlRegExp. <br>NOTE: returnURL is documented with 64 chars limit but seem not a hard limit, and 64 is too few in some scenar
 * @property {string} title optional: true, max: 255. <br>NOTE: no max limit documented for this field, this is just a safe val
 * @property {string} transactionId max: 34
 * @property {string} vpcAccessCode max: 8
 * @property {string} vpcCommand max: 16
 * @property {string} vpcMerchant max: 16
 * @property {string} vpcVersion max: 2
 */

/**
 * OnePay configSchema
 * @type {SimpleSchema}
 */
OnePay.configSchema = new SimpleSchema({
	accessCode: { type: String },
	merchant: { type: String },
	paymentGateway: { type: String, regEx: SimpleSchema.RegEx.Url },
	secureSecret: { type: String },
});
// should not be changed
OnePay.VERSION = '2';
OnePay.COMMAND = 'pay';
// onepay only support VND
OnePay.CURRENCY_VND = 'VND';
OnePay.LOCALE_EN = 'en';
OnePay.LOCALE_VN = 'vn';

export { OnePay };
