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
	/**
	 *
	 * @param {*} responseCode Responde code from gateway
	 * @param {*} locale Same locale at the buildCheckoutUrl. Note, 'vn' for Vietnamese
	 */
	static getReturnUrlStatus(responseCode, locale = 'vn') {
		const responseCodeTable = {
			0: {
				vn: 'Giao dịch thành công',
				en: 'Approved',
			},
			1: {
				vn: 'Ngân hàng từ chối giao dịch',
				en: 'Bank Declined',
			},
			3: {
				vn: 'Mã đơn vị không tồn tại',
				en: 'Merchant not exist',
			},
			4: {
				vn: 'Không đúng access code',
				en: 'Invalid access code',
			},
			5: {
				vn: 'Số tiền không hợp lệ',
				en: 'Invalid amount',
			},
			6: {
				vn: 'Mã tiền tệ không tồn tại',
				en: 'Invalid currency code',
			},
			7: {
				vn: 'Lỗi không xác định',
				en: 'Unspecified Failure ',
			},
			8: {
				vn: 'Số thẻ không đúng',
				en: 'Invalid card Number',
			},
			9: {
				vn: 'Tên chủ thẻ không đúng',
				en: 'Invalid card name',
			},
			10: {
				vn: 'Thẻ hết hạn/Thẻ bị khóa',
				en: 'Expired Card',
			},
			11: {
				vn: 'Thẻ chưa đăng ký sử dụng dịch vụ',
				en: 'Card Not Registed Service(internet banking)',
			},
			12: {
				vn: 'Ngày phát hành/Hết hạn không đúng',
				en: 'Invalid card date',
			},
			13: {
				vn: 'Vượt quá hạn mức thanh toán',
				en: 'Exist Amount',
			},
			21: {
				vn: 'Số tiền không đủ để thanh toán',
				en: 'Insufficient fund',
			},
			22: {
				vn: 'Thông tin tài khoản không đúng',
				en: 'Invalid Account',
			},
			23: {
				vn: 'Tài khoản bị khóa',
				en: 'Account Locked',
			},
			24: {
				vn: 'Thông tin thẻ không đúng',
				en: 'Invalid Card Info',
			},
			25: {
				vn: 'OTP không đúng',
				en: 'Invalid OTP',
			},
			253: {
				vn: 'Quá thời gian thanh toán',
				en: 'Transaction timeout',
			},
			99: {
				vn: 'Người sử dụng hủy giao dịch',
				en: 'User cancel',
			},
			default: {
				vn: 'Giao dịch thất bại',
				en: 'Unknown Failure',
			},
		};

		const respondText = responseCodeTable[responseCode];

		return respondText ? respondText[locale] : responseCodeTable.default[locale];
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
	// NOTE: there is an inconsistency in OnePayDom vs. Intl that we had to test to find out,
	// while intl allows 10 digits, domestic only allows max 9 digits (999.999.999VND)
	amount               : { type: SimpleSchema.Integer, max: 9999999999 },
	// NOTE: billing address is not expected in domestic but keep them here so that
	// same input data can be used for both dom. and intl. gateway
	billingCity          : { type: String, optional: true, max: 64 },
	billingCountry       : { type: String, optional: true, max: 2 },
	billingPostCode      : { type: String, optional: true, max: 64 },
	billingStateProvince : { type: String, optional: true, max: 64 },
	billingStreet        : { type: String, optional: true, max: 64 },
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

export { OnePayDomestic };
