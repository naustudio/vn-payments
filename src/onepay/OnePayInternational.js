/* © 2018 NauStud.io
 * @author Thanh
 */
import SimpleSchema from 'simpl-schema';
import { OnePay } from './OnePay';

/**
 * OnePay International payment gateway helper
 *
 * Supports Master Card, Visa
 *
 * @example:
 * ```
 * import { OnePayInternational, TEST_INTL_CONFIG } from './imports/onepay';
 *
 * const onepayCheckout = new OnePayInternational({
 * 	accessCode: TEST_INTL_CONFIG.accessCode,
 * 	merchant: TEST_INTL_CONFIG.merchant,
 * 	paymentGateway: TEST_INTL_CONFIG.paymentGateway,
 * 	secureSecret: TEST_INTL_CONFIG.secureSecret,
 * });
 *
 * // checkoutUrl is an URL instance
 * const checkoutUrl = onepayCheckout.buildCheckoutUrl(params);
 *
 * this.response.writeHead(301, { Location: checkoutUrl.href });
 * this.response.end();
 * ```
 */
class OnePayInternational extends OnePay {
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

	/**
	 * Instantiate a OnePayInternational checkout helper
	 *
	 * @param  {Object} config check OnePay.configSchema for data type requirements
	 * @return {void}
	 */
	constructor(config = {}) {
		super(config, 'international');
	}

	/**
	 *
	 * @param {*} payload
	 * @override
	 */
	validateCheckoutPayload(payload) {
		OnePayInternational.checkoutSchema.validate(payload);
	}

	/**
	 * @return {Object} default payload object
	 */
	get checkoutPayloadDefaults() {
		/* prettier-ignore */
		return {
			billingCity: '',
			billingCountry: '',
			billingPostCode: '',
			billingStateProvince: '',
			billingStreet: '',
			currency: OnePay.CURRENCY_VND,
			deliveryAddress: '',
			deliveryCity: '',
			deliveryCountry: '',
			customerEmail: null, // do not use '' since it will be validated with Email RegExp
			customerPhone: '',
			deliveryProvince: '',
			locale: OnePay.LOCALE_VN,
			title: 'VPC 3-Party',
			customerId: '',
			vpcAccessCode: '',
			vpcCommand: OnePay.VPC_COMMAND,
			vpcMerchant: '',
			vpcVersion: OnePay.VPC_VERSION,
		};
	}
}

// The schema is based on field data requirements from OnePay's dev document
/* prettier-ignore */
OnePayInternational.checkoutSchema = new SimpleSchema({
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

OnePayInternational.TEST_GATEWAY = 'https://mtf.onepay.vn/onecomm-pay/vpc.op';
OnePayInternational.VPC_VERSION = '2';
OnePayInternational.VPC_COMMAND = 'pay';
// onepay only support VND
OnePayInternational.CURRENCY_VND = 'VND';
OnePayInternational.LOCALE_EN = 'en';
OnePayInternational.LOCALE_VN = 'vn';

export { OnePayInternational };
