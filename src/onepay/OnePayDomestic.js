/* © 2018 NauStud.io
 * @author Thanh
 */
import SimpleSchema from 'simpl-schema';
import { OnePay } from './OnePay';
import { urlRegExp } from '../utils';

/**
 * OnePay Domestic payment gateway helper
 *
 * Supports VN domestic ATM cards
 *
 * @example:
 * ```
 * import { OnePayDomestic, TEST_DOM_CONFIG } from './imports/onepay';
 *
 * const onepayCheckout = new OnePayDomestic({
 * 	accessCode: TEST_DOM_CONFIG.accessCode,
 * 	merchant: TEST_DOM_CONFIG.merchant,
 * 	paymentGateway: TEST_DOM_CONFIG.paymentGateway,
 * 	secureSecret: TEST_DOM_CONFIG.secureSecret,
 * });
 *
 * // checkoutUrl is an URL instance
 * const checkoutUrl = onepayCheckout.buildCheckoutUrl(params);
 *
 * this.response.writeHead(301, { Location: checkoutUrl.href });
 * this.response.end();
 * ```
 */
class OnePayDomestic extends OnePay {
	static getReturnUrlStatus(responseCode) {
		switch (String(responseCode)) {
			case '0':
				return 'Giao dịch thành công - Approved';
			case '1':
				return 'Ngân hàng từ chối giao dịch - Bank Declined';
			case '3':
				return 'Mã đơn vị không tồn tại - Merchant not exist';
			case '4':
				return 'Không đúng access code - Invalid access code';
			case '5':
				return 'Số tiền không hợp lệ - Invalid amount';
			case '6':
				return 'Mã tiền tệ không tồn tại - Invalid currency code';
			case '7':
				return 'Lỗi không xác định - Unspecified Failure ';
			case '8':
				return 'Số thẻ không đúng - Invalid card Number';
			case '9':
				return 'Tên chủ thẻ không đúng - Invalid card name';
			case '10':
				return 'Thẻ hết hạn/Thẻ bị khóa - Expired Card';
			case '11':
				return 'Thẻ chưa đăng ký sử dụng dịch vụ - Card Not Registed Service(internet banking)';
			case '12':
				return 'Ngày phát hành/Hết hạn không đúng - Invalid card date';
			case '13':
				return 'Vượt quá hạn mức thanh toán - Exist Amount';
			case '21':
				return 'Số tiền không đủ để thanh toán - Insufficient fund';
			case '22':
				return 'Thông tin tài khoản không đúng - Invalid Account';
			case '23':
				return 'Tài khoản bị khóa - Account Locked';
			case '24':
				return 'Thông tin thẻ không đúng - Invalid Card Info';
			case '25':
				return 'OTP không đúng - Invalid OTP';
			case '253':
				return 'Quá thời gian thanh toán - Transaction timeout';
			case '99':
				return 'Người sử dụng hủy giao dịch - User cancel';
			default:
				return 'Giao dịch thất bại - Failured';
		}
	}

	/**
	 * Instantiate a OnePayDomestic checkout helper
	 *
	 * @param  {Object} config check OnePay.configSchema for data type requirements
	 * @return {void}
	 */
	constructor(config = {}) {
		super(config, 'domestic');
	}

	/**
	 *
	 * @param {*} payload
	 * @override
	 */
	validateCheckoutPayload(payload) {
		OnePayDomestic.checkoutSchema.validate(payload);
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
OnePayDomestic.checkoutSchema = new SimpleSchema({
	againLink            : { type: String, optional: true, max: 64, regEx: urlRegExp },
	// NOTE: there is a ridiculus inconsistency in OnePay document,
	// while intl allows 10 digits, domestic only allows max 9 digits (999.999.999VND)
	amount               : { type: SimpleSchema.Integer, max: 9999999999 },
	// NOTE: billing address is not expected in domestic
	billingCity          : { type: String, optional: true, max: 255 }, // NOTE: no max limit documented for optional fields, this is just a safe value
	billingCountry       : { type: String, optional: true, max: 255 },
	billingPostCode      : { type: String, optional: true, max: 255 },
	billingStateProvince : { type: String, optional: true, max: 255 },
	billingStreet        : { type: String, optional: true, max: 255 },
	clientIp             : { type: String, max: 15 },
	currency             : { type: String, allowedValues: ['VND'] },
	customerEmail        : { type: String, optional: true, max: 24, regEx: SimpleSchema.RegEx.Email },
	customerId           : { type: String, optional: true, max: 64 },
	customerPhone        : { type: String, optional: true, max: 16 },
	deliveryAddress      : { type: String, optional: true, max: 64 },
	deliveryCity         : { type: String, optional: true, max: 64 },
	deliveryCountry      : { type: String, optional: true, max: 8 },
	deliveryProvince     : { type: String, optional: true, max: 64 },
	locale               : { type: String, allowedValues: ['vn', 'en'] },
	orderId              : { type: String, max: 32 },
	returnUrl            : { type: String, max: 64, regEx: urlRegExp },
	title                : { type: String, optional: true, max: 255 }, // NOTE: no max limit documented for this field, this is just a safe value
	transactionId        : { type: String, max: 34 },
	vpcAccessCode        : { type: String, max: 8 },
	vpcCommand           : { type: String, max: 16 },
	vpcMerchant          : { type: String, max: 16 },
	vpcVersion           : { type: String, max: 2 },
});

OnePayDomestic.TEST_GATEWAY = 'https://mtf.onepay.vn/onecomm-pay/vpc.op';
// OnePayDomestic.VPC_VERSION = '2';
// OnePayDomestic.VPC_COMMAND = 'pay';
// onepay only support VND
// OnePayDomestic.CURRENCY_VND = 'VND';
// OnePayDomestic.LOCALE_EN = 'en';
// OnePayDomestic.LOCALE_VN = 'vn';

export { OnePayDomestic };
