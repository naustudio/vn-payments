/* © 2018 NauStud.io
 * @author Thanh
 */
import SimpleSchema from 'simpl-schema';
import { OnePay } from './OnePay';
import { urlRegExp } from '../utils';

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
	/**
	 *
	 * @param {*} responseCode Responde code from gateway
	 * @param {*} locale Same locale at the buildCheckoutUrl. Note, 'vn' for Vietnamese
	 */
	static getReturnUrlStatus(responseCode, locale = 'vn') {
		const responseCodeTable = {
			0: {
				vn: 'Giao dịch thành công',
				en: 'Transaction is successful',
			},
			1: {
				vn: 'Ngân hàng phát hành thẻ không cấp phép. Vui lòng liên hệ ngân hàng',
				en: 'Issuer Bank declined the transaction. Please contact Issuer Bank',
			},
			2: {
				vn:
					'Ngân hàng phát hành từ chối cấp phép, do số dư không đủ thanh toán hoặc chưa đăng ký dịch vụ thanh toán trực tuyến',
				en: 'Bank Declined Transaction',
			},
			3: {
				vn: 'Cổng thanh toán không nhận được kết quả trả về từ ngân hàng phát hành thẻ',
				en: 'Issuer Bank declined the transaction',
			},
			4: {
				vn: 'Thẻ hết hạn sử dụng',
				en: 'Your card is expired',
			},
			5: {
				en: 'Your credit account is insufficient funds',
				vn: 'Thẻ không đủ hạn mức hoặc tài khoản không đủ số dư thanh toán.',
			},
			6: {
				en: 'Error from Issuer Bank.',
				vn: 'Lỗi từ ngân hàng phát hành thẻ.',
			},
			7: {
				en: 'Error when processing transaction',
				vn: 'Lỗi phát sinh trong quá trình xử lý giao dịch',
			},
			8: {
				en: 'Issuer Bank does not support E-commerce transaction',
				vn: 'Ngân hàng phát hành thẻ không hỗ trợ giao dịch Internet',
			},
			9: {
				en: 'Issuer Bank declined the transaction. Please contact Issuer Bank.',
				vn: 'Ngân hàng phát hành thẻ từ chối giao dịch.',
			},
			99: {
				en: 'User cancel',
				vn: 'Người dùng hủy giao dịch',
			},
			B: {
				en: 'Cannot authenticated by 3D-Secure Program. Please contact Issuer Bank.',
				vn: 'Không xác thực được 3D- Secure. Liên hệ ngân hàng phát hành để được hỗ trợ.',
			},
			E: {
				en: 'Wrong CSC entered or Issuer Bank declined the transaction. Please contact Issuer Bank.',
				vn: 'Bạn nhập sai CSC hoặc thẻ vượt quá hạn mức lần thanh toán',
			},
			F: {
				en: '3D Secure Authentication Failed',
				vn: 'Giao dịch thất bại. Không xác thực được 3D',
			},
			Z: {
				en: 'Transaction was block by OFD',
				vn: 'Giao dịch bị chặn bởi hệ thống ODF',
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
	againLink            : { type: String, max: 64, regEx: urlRegExp },
	// NOTE: there is an inconsistency in OnePayDom vs. Intl that we had to test to find out,
	// while intl allows 10 digits, domestic only allows max 9 digits (999.999.999VND)
	amount               : { type: SimpleSchema.Integer, max: 9999999999 },
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

export { OnePayInternational };
