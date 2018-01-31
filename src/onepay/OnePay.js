/* © 2018 NauStud.io
 * @author Jacob Pham, Thanh Tran
 */
import { URL } from 'url';
import SimpleSchema from 'simpl-schema';
import { toUpperCase, pack, hashHmac } from '../utils';

/**
 * This is the base class for domestic and intl payment gateways
 * which bear the common hashing algorithym.
 *
 * It should not be used alone.
 *
 * @private
 */
class OnePay {
	/**
	 * Instantiate a OnePay checkout helper
	 *
	 * @param  {Object} config check OnePay.configSchema for data type requirements
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
	 *
	 * Hàm xây dựng url để redirect qua OnePay gateway, trong đó có tham số mã hóa (còn gọi là public key).
	 *
	 * @param  {Object} payload Object that contains needed data for the URL builder, refer to typeCheck object above
	 * @return {Promise} buildCheckoutUrl promise
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
	 * Build the schema in subclass
	 * @param {*} payload
	 */
	// eslint-disable-next-line no-unused-vars
	validateCheckoutPayload(payload) {
		throw new Error('validateCheckoutPayload() requires overloading');
	}

	get checkoutPayloadDefaults() {
		return {};
	}

	/**
	 * Verify return query string from OnePay using enclosed vpc_SecureHash string
	 *
	 * Hàm thực hiện xác minh tính đúng đắn của các tham số trả về từ onepay Payment
	 *
	 * @param  {Object} query Query data object from GET handler (`response.query`)
	 * @return {Promise<Object>} Normalized return data object, with additional fields like isSuccess
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
