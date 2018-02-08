/* © 2018 NauStud.io
 * @author Thanh
 */
import SimpleSchema from 'simpl-schema';
import { OnePay } from './OnePay';
import { urlRegExp } from '../utils';

/**
 * OnePay Domestic payment gateway helper.
 * <br>
 * Supports VN domestic ATM cards
 *
 * _Hàm hỗ trợ cổng thanh toán nội địa OnePay_
 * <br>
 * _Hỗ trợ thẻ ATM nội địa_
 *
 * @extends OnePay
 *
 * @example
 * import { OnePayDomestic } from 'vn-payments';
 *
 * const TEST_CONFIG = OnePayDomestic.TEST_CONFIG;
 *
 * const onepayCheckout = new OnePayDomestic({
 * 	accessCode: TEST_CONFIG.accessCode,
 * 	merchant: TEST_CONFIG.merchant,
 * 	paymentGateway: TEST_CONFIG.paymentGateway,
 * 	secureSecret: TEST_CONFIG.secureSecret,
 * });
 *
 * // checkoutUrl is an URL instance
 * const checkoutUrl = await onepayCheckout.buildCheckoutUrl(params);
 *
 * this.response.writeHead(301, { Location: checkoutUrl.href });
 * this.response.end();
 */
class OnePayDomestic extends OnePay {
	/**
	 *
	 * @param {*} responseCode Response code from gateway. <br> _Mã trả về từ cổng thanh toán._
	 * @param {*} 	locale Same locale at the buildCheckoutUrl. Note, 'vn' for Vietnamese. <br> _Cùng nơi với hàm buildCheckoutUrl. Lưu ý, Việt Nam là 'vn'_
	 * @return {string}  A string contains error status converted from response code. <br> _Một chuỗi chứa trạng thái lỗi được chuyển lại từ response code_
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
	 * <br>
	 * _Khởi tạo hàm thanh toán OnePayDomestic_
	 * @param  {Object} config check OnePay.configSchema for data type requirements. <br> _Xem OnePay.configSchema để biết yêu cầu kiểu dữ liệu_
	 * @return {void}
	 */
	constructor(config = {}) {
		super(config, 'domestic');
	}

	/**
	 * Validate checkout payload against specific schema. Throw ValidationErrors if invalid against checkoutSchema.
	 *
	 * _Kiểm tra tính hợp lệ của dữ liệu thanh toán dựa trên schema đã được đồng bộ với tài liệu của nhà cung cấp.
	 * Hiển thị lỗi nếu không hợp lệ với checkoutSchema._
	 * @param {OnePayCheckoutPayload} payload
	 * @override
	 */
	validateCheckoutPayload(payload) {
		OnePayDomestic.checkoutSchema.validate(payload);
	}

	/**
	 * Return default checkout Payloads
	 *
	 * _Lấy checkout payload mặc định cho cổng thanh toán này_
	 * @return {OnePayCheckoutPayload} default payload object <br> _Dữ liệu mặc định của đối tượng_
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
			vpcCommand: OnePay.COMMAND,
			vpcMerchant: '',
			vpcVersion: OnePay.VERSION,
		};
	}
	/**
	 *
	 * @typedef {Object} OnePayDomesticReturnObject
	 * @property {boolean} isSuccess whether the payment succeeded or not
	 * @property {number} amount amount paid by customer, already divided by 100
	 * @property {string} command should be same with checkout request
	 * @property {string} currencyCode currency code, should be same with checkout request
	 * @property {string} gatewayTransactionNo Gateway's own transaction ID, used to look up at Gateway's side
	 * @property {string} locale locale code, should be same with checkout request
	 * @property {string} merchant merchant ID, should be same with checkout request
	 * @property {string} message Approve or error message based on response code
	 * @property {string} orderId merchant's order ID, should be same with checkout request
	 * @property {string} responseCode response code, payment has errors if it is non-zero
	 * @property {string} secureHash checksum of the returned data, used to verify data integrity
	 * @property {string} transactionId merchant's transaction ID, should be same with checkout request
	 * @property {string} version should be same with checkout request
	 *
	 * @property {string} vpc_AdditionData e.g: 970436
	 * @property {string} vpc_Amount e.g: 1000000
	 * @property {string} vpc_Command e.g: pay
	 * @property {string} vpc_CurrencyCode e.g: VND
	 * @property {string} vpc_Locale e.g: vn
	 * @property {string} vpc_Merchant e.g: ONEPAY
	 * @property {string} vpc_MerchTxnRef e.g: TEST_15160802610161733380665
	 * @property {string} vpc_OrderInfo e.g: TEST_15160802610161733380665
	 * @property {string} vpc_SecureHash e.g: B5CD330E2DC1B1C116A068366F69717F54AD77E1BE0C40E4E3700551BE9D5004
	 * @property {string} vpc_TransactionNo e.g: 1618136
	 * @property {string} vpc_TxnResponseCode e.g: 0
	 * @property {string} vpc_Version e.g: 2
	 */
	/**
	 * Verify return query string from OnePay using enclosed vpc_SecureHash string
	 *
	 * _Hàm thực hiện xác minh tính đúng đắn của các tham số trả về từ onepay Payment_
	 *
	 * @param {*} query Query data object from GET handler (`response.query`). <br> _Object query trả về từ GET handler_
	 * @returns { Promise<OnePayDomesticReturnObject> } Promise object which resolved with normalized returned data object, with additional fields like isSuccess. <br> _Promise khi hoàn thành sẽ trả về object data từ cổng thanh toán, được chuẩn hóa tên theo camelCase và đính kèm thuộc tính isSuccess_
	 */
	verifyReturnUrl(query) {
		return super.verifyReturnUrl(query).then(verifyResults => {
			const returnObject = {
				amount: parseInt(query.vpc_Amount, 10) / 100,
				command: query.vpc_Command,
				currencyCode: query.vpc_CurrencyCode,
				locale: query.vpc_Locale,
				merchant: query.vpc_Merchant,
				message: OnePayDomestic.getReturnUrlStatus(query.vpc_TxnResponseCode, query.vpc_Locale), // no message from gateway, we'll look it up on our side
				gatewayTransactionNo: query.vpc_TransactionNo,
				orderId: query.vpc_OrderInfo,
				responseCode: query.vpc_TxnResponseCode,
				secureHash: query.vpc_SecureHash,
				transactionId: query.vpc_MerchTxnRef,
				version: query.vpc_Version,
			};

			// keep vpc_* fields from gateway
			return Object.assign(returnObject, query, verifyResults);
		});
	}
}

/* prettier-ignore */
/**
 * The schema is based on field data requirements from OnePay's dev document
 * <br>
 * _Cấu trúc dữ liệu được dựa trên các yêu cầu của tài liệu OnePay_
 * @type {SimpleSchema}
 */
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
	returnUrl            : { type: String, max: 255, regEx: urlRegExp }, // NOTE: returnURL is documented with 64 chars limit but seem not a hard limit, and 64 is too few in some scenario
	title                : { type: String, optional: true, max: 255 }, // NOTE: no max limit documented for this field, this is just a safe value
	transactionId        : { type: String, max: 34 },
	vpcAccessCode        : { type: String, max: 8 },
	vpcCommand           : { type: String, max: 16 },
	vpcMerchant          : { type: String, max: 16 },
	vpcVersion           : { type: String, max: 2 },
});

/**
 * OnePayDomestic test configs
 *
 * _Cấu hình dùng thử OnePay Domestic._
 */
OnePayDomestic.TEST_CONFIG = {
	accessCode: 'D67342C2',
	merchant: 'ONEPAY',
	paymentGateway: 'https://mtf.onepay.vn/onecomm-pay/vpc.op',
	secureSecret: 'A3EFDFABA8653DF2342E8DAC29B51AF0',
};

export { OnePayDomestic };
