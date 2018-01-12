/* © 2017 NauStud.io
 * @author Jacob Pham, Thanh Tran
 * TODO: I think it's better to create one class for each domestic and intl gateway
 */
/*eslint-disable no-shadow, key-spacing, no-param-reassign*/
import SimpleSchema from 'simpl-schema';
import { URL } from 'url';
import { toUpperCase, pack, hashHmac } from './utils';

// The schema is based on field data requirements from OnePay's dev document
/* prettier-ignore */
const onepayDataSchema = new SimpleSchema({
	againLink            : { type: String }, // againLink is only required by International gateway
	// NOTE: there is a ridiculus inconsistency in OnePay document,
	// while intl allows 10 digits, domestic only allows max 9 digits (999.999.999VND)
	amount               : { type: SimpleSchema.Integer, max: 9999999999 },
	billingCity          : { type: String, optional: true, max: 255 }, // NOTE: no max limit documented for optional fields, this is just a safe value
	billingCountry       : { type: String, optional: true, max: 255 },
	billingPostCode      : { type: String, optional: true, max: 255 },
	billingStateProvince : { type: String, optional: true, max: 255 },
	billingStreet        : { type: String, optional: true, max: 255 },
	clientIp             : { type: String, max: 45 },
	currency             : { type: String, allowedValues: ['VND'] },
	customerEmail        : { type: String, optional: true, max: 255, regEx: SimpleSchema.RegEx.Email },
	customerId           : { type: String, optional: true, max: 255 },
	customerPhone        : { type: String, optional: true, max: 255 },
	deliveryAddress      : { type: String, optional: true, max: 255 },
	deliveryCity         : { type: String, optional: true, max: 255 },
	deliveryCountry      : { type: String, optional: true, max: 255 },
	deliveryProvince     : { type: String, optional: true, max: 255 },
	locale               : { type: String, allowedValues: ['vn', 'en'] },
	orderId              : { type: String, max: 34 },
	returnUrl            : { type: String, max: 255 },
	title                : { type: String, optional: true, max: 255 },
	transactionId        : { type: String, max: 40 },
	vpcAccessCode        : { type: String, max: 8 },
	vpcCommand           : { type: String, max: 16 },
	vpcMerchant          : { type: String, max: 16 },
	vpcVersion           : { type: String, max: 2 },
});

const onepayConfigSchema = new SimpleSchema({
	paymentGateway: { type: String },
	accessCode: { type: String },
	merchant: { type: String },
	secureSecret: { type: String },
	againLink: {
		type: String,
		optional: true,
		max: 255,
		custom() {
			let shouldBeRequired = false;
			const gateway = this.field('paymentGateway').value;
			if (gateway.includes('vpcpay')) {
				// International gateway requires againLink
				shouldBeRequired = true;
			}

			if (shouldBeRequired && (this.value == null || this.value === '')) {
				return SimpleSchema.ErrorTypes.REQUIRED;
			}

			// field is valid
			return undefined;
		},
	},
});

/**
 * OnePay payment gateway helper
 * Support both domestic card and international (credit) card payment
 *
 * @example:
 * ```
 * import OnePay from './imports/onepay';
 *
 * const onepayCheckout = new OnePay({
 * 	paymentGateway: OnePay.GATEWAY_INTERNATIONAL,
 * 	accessCode: OnePay.TEST_INTL_ACCESS_CODE,
 * 	merchant: OnePay.TEST_INTL_MERCHANT,
 * 	secureSecret: OnePay.TEST_INTL_SECURE_SECRET,
 * 	againLink: Meteor.settings.url + '/test',
 * });
 *
 * // checkoutUrl is an URL instance
 * const checkoutUrl = onepayCheckout.buildCheckoutUrl(params);
 *
 * this.response.writeHead(301, { Location: checkoutUrl.href });
 * this.response.end();
 * ```
 */
class OnePay {
	/**
	 * Instantiate a OnePay checkout helper
	 *
	 * @param  {Object} config check function source for required properties
	 * @return {void}
	 */
	constructor(config) {
		this.config = Object.assign({}, config);
		// check type validity
		onepayConfigSchema.validate(this.config);
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
		// Mảng các tham số chuyển tới Onepay Payment
		const data = Object.assign({}, OnePay.payloadDefaults, payload);
		const config = this.config;

		data.vpcMerchant = config.merchant;
		data.vpcAccessCode = config.accessCode;

		// againLink is required by Intl gateway
		if (config.againLink) {
			data.againLink = config.againLink;
		}

		// Input type checking
		onepayDataSchema.validate(data);

		// convert amount to OnePay format (100 = 1VND):
		data.amount = Math.floor(data.amount * 100);

		// IMPORTANT: the keys' order must be exactly like below
		/* prettier-ignore */
		const arrParam = {
			AVS_City           : data.billingCity,
			AVS_Country        : data.billingCountry,
			AVS_PostCode       : data.billingPostCode,
			AVS_StateProv      : data.billingStateProvince,
			AVS_Street01       : data.billingStreet,
			AgainLink          : data.againLink,
			Title              : data.title,
			vpc_AccessCode     : data.vpcAccessCode,
			vpc_Amount         : String(data.amount),
			vpc_Command        : data.vpcCommand,
			vpc_Currency       : data.currency,
			vpc_Customer_Email : data.customerEmail,
			vpc_Customer_Id    : data.customerId,
			vpc_Customer_Phone : data.customerPhone,
			vpc_Locale         : data.locale,
			vpc_MerchTxnRef    : data.transactionId,
			vpc_Merchant       : data.vpcMerchant,
			vpc_OrderInfo      : data.orderId,
			vpc_ReturnURL      : data.returnUrl,
			vpc_SHIP_City      : data.deliveryCity,
			vpc_SHIP_Country   : data.deliveryCountry,
			vpc_SHIP_Provice   : data.deliveryProvince, // NOTE: vpc_SHIP_Provice is exact in the sample code
			vpc_SHIP_Street01  : data.deliveryAddress,
			vpc_TicketNo       : data.clientIp,
			vpc_Version        : data.vpcVersion,
		};

		// special case: Intl gateway don't checksum **vps_Currency**, so we have to delete it from params :(
		if (config.paymentGateway.includes('vpcpay')) {
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

		return redirectUrl;
	}

	/**
	 * Verify return query string from OnePay using enclosed vpc_SecureHash string
	 *
	 * Hàm thực hiện xác minh tính đúng đắn của các tham số trả về từ onepay Payment
	 *
	 * @param  {Object} data Query data object from GET handler (`response.query`)
	 * @return {boolean}      Whether the return query params are genuine (hash checksum check)
	 */
	verifyReturnUrl(data) {
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
				return true;
			}
		}

		return false;
	}

	static getReturnUrlStatus(responseCode) {
		let result;

		switch (String(responseCode)) {
			case '0':
				result = 'Giao dịch thành công - Approved';
				break;
			case '1':
				result = 'Ngân hàng từ chối giao dịch - Bank Declined';
				break;
			case '3':
				result = 'Mã đơn vị không tồn tại - Merchant not exist';
				break;
			case '4':
				result = 'Không đúng access code - Invalid access code';
				break;
			case '5':
				result = 'Số tiền không hợp lệ - Invalid amount';
				break;
			case '6':
				result = 'Mã tiền tệ không tồn tại - Invalid currency code';
				break;
			case '7':
				result = 'Lỗi không xác định - Unspecified Failure ';
				break;
			case '8':
				result = 'Số thẻ không đúng - Invalid card Number';
				break;
			case '9':
				result = 'Tên chủ thẻ không đúng - Invalid card name';
				break;
			case '10':
				result = 'Thẻ hết hạn/Thẻ bị khóa - Expired Card';
				break;
			case '11':
				result = 'Thẻ chưa đăng ký sử dụng dịch vụ - Card Not Registed Service(internet banking)';
				break;
			case '12':
				result = 'Ngày phát hành/Hết hạn không đúng - Invalid card date';
				break;
			case '13':
				result = 'Vượt quá hạn mức thanh toán - Exist Amount';
				break;
			case '21':
				result = 'Số tiền không đủ để thanh toán - Insufficient fund';
				break;
			case '99':
				result = 'Người sủ dụng hủy giao dịch - User cancel';
				break;
			default:
				result = 'Giao dịch thất bại - Failured';
		}

		return result;
	}
}

// should not be changed
OnePay.GATEWAY_DOSMESTIC = 'https://mtf.onepay.vn/onecomm-pay/vpc.op';
OnePay.GATEWAY_INTERNATIONAL = 'https://mtf.onepay.vn/vpcpay/vpcpay.op';
OnePay.VPC_VERSION = '2';
OnePay.VPC_COMMAND = 'pay';
// onepay only support VND
OnePay.CURRENCY_VND = 'VND';
OnePay.LOCALE_EN = 'en';
OnePay.LOCALE_VN = 'vn';

// Test accounts
OnePay.TEST_DOMESTIC_MERCHANT = 'ONEPAY';
OnePay.TEST_DOMESTIC_ACCESS_CODE = 'D67342C2';
OnePay.TEST_DOMESTIC_SECURE_SECRET = 'A3EFDFABA8653DF2342E8DAC29B51AF0';

OnePay.TEST_INTL_MERCHANT = 'TESTONEPAY';
OnePay.TEST_INTL_ACCESS_CODE = '6BEB2546';
OnePay.TEST_INTL_SECURE_SECRET = '6D0870CDE5F24F34F3915FB0045120DB';

/* prettier-ignore */
OnePay.payloadDefaults = {
	againLink            : '',
	billingCity          : '',
	billingCountry       : '',
	billingPostCode      : '',
	billingStateProvince : '',
	billingStreet        : '',
	currency             : OnePay.CURRENCY_VND,
	deliveryAddress      : '',
	deliveryCity         : '',
	deliveryCountry      : '',
	customerEmail        : null, // do not use '' since it will be validated with Email RegExp
	customerPhone        : '',
	deliveryProvince     : '',
	locale               : OnePay.LOCALE_VN,
	title                : 'VPC 3-Party',
	customerId           : '',
	vpcAccessCode        : '',
	vpcCommand           : OnePay.VPC_COMMAND,
	vpcMerchant          : '',
	vpcVersion           : OnePay.VPC_VERSION,
};

/* eslint-disable no-unused-vars */
// for reference, not used for now
const onepayDomReturnSchema = new SimpleSchema(
	{
		vpc_AdditionData: String,
		vpc_Amount: String,
		vpc_Command: String,
		vpc_CurrencyCode: String,
		vpc_Locale: String,
		vpc_MerchTxnRef: String,
		vpc_Merchant: String,
		vpc_OrderInfo: String,
		vpc_TransactionNo: String,
		vpc_TxnResponseCode: String,
		vpc_Version: String,
		vpc_SecureHash: String,
	},
	{ requiredByDefault: false }
);

// for reference, not used for now
const onepayIntlReturnSchema = new SimpleSchema(
	{
		vpc_OrderInfo: String,
		vpc_3DSECI: String,
		vpc_3DSenrolled: String,
		vpc_3DSXID: String,
		vpc_AcqAVSRespCode: String,
		vpc_AcqCSCRespCode: String,
		vpc_AcqResponseCode: String,
		vpc_Amount: String,
		vpc_AuthorizeId: String,
		vpc_AVS_City: String,
		vpc_AVS_Country: String,
		vpc_AVS_StateProv: String,
		vpc_AVS_Street01: String,
		vpc_AVSRequestCode: String,
		vpc_AVSResultCode: String,
		vpc_BatchNo: String,
		vpc_Card: String,
		vpc_CardLevelIndicator: String,
		vpc_CardNum: String,
		vpc_Command: String,
		vpc_CommercialCard: String,
		vpc_CommercialCardIndicator: String,
		vpc_CSCResultCode: String,
		vpc_Locale: String,
		vpc_MarketSpecificData: String,
		vpc_Merchant: String,
		vpc_MerchTxnRef: String,
		vpc_Message: String,
		vpc_ReceiptNo: String,
		vpc_ReturnACI: String,
		vpc_RiskOverallResult: String,
		vpc_SecureHash: String,
		vpc_TransactionIdentifier: String,
		vpc_TransactionNo: String,
		vpc_TxnResponseCode: String,
		vpc_VerSecurityLevel: String,
		vpc_Version: String,
		vpc_VerStatus: String,
		vpc_VerType: String,
	},
	{ requiredByDefault: false }
);

export { OnePay };
