/* © 2018 NauStud.io
 * @author Thanh
 */
import SimpleSchema from 'simpl-schema';
import { OnePay } from './OnePay';
import { urlRegExp } from '../utils';

/**
 * OnePay International payment gateway helper.
 * <br>
 * Supports Master Card, Visa.
 *
 * _Hàm hỗ trợ thanh toán qua OnePay Quốc Tế_
 * <br>
 * _Hỗ trợ thẻ Master và Visa_
 *
 *
 * @extends OnePay
 * @example
 * import { OnePayInternational } from 'vn-payments';
 *
 * const TEST_CONFIG = OnePayDomestic.TEST_CONFIG;
 *
 * const onepayCheckout = new OnePayInternational({
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
class OnePayInternational extends OnePay {
	/**
	 *
	 * @param {*} responseCode Responde code from gateway <br> _Mã trả về từ cổng thanh toán_
	 * @param {*} locale Same locale at the buildCheckoutUrl. Note, 'vn' for Vietnamese <br> _Cùng nơi với hàm buildCheckoutUrl. Lưu ý, 'vn' là Việt Nam_
	 * @return {string}  A string contains error status converted from response code <br> _Một chuỗi chứa trạng thái lỗi được chuyển lại từ response code_
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
	 *<br>
	 * _Khởi tạo hàm thanh toán OnePayInternational_
	 * @param  {Object} config check OnePay.configSchema for data type requirements. <br> _Xem OnePay.configSchema để biết yêu cầu kiểu dữ liệu_
	 * @return {void}
	 */
	constructor(config = {}) {
		super(config, 'international');
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
		OnePayInternational.checkoutSchema.validate(payload);
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
	 * @typedef {Object} OnePayInternationalReturnObject
	 * @property {boolean} isSuccess whether the payment succeeded or not
	 * @property {number} amount amount paid by customer, already divided by 100
	 * @property {string} command should be same with checkout request
	 * @property {string} billingCity billing address' city
	 * @property {string} billingCountry  billing address' country
	 * @property {string} billingPostCode billing address' post code
	 * @property {string} billingStateProvince billing address' state or province
	 * @property {string} billingStreet billing address and street name
	 * @property {string} card type of card used to pay, VC, MC, JC, AE
	 * @property {string} currencyCode currency code, should be same with checkout request
	 * @property {string} gatewayTransactionNo Gateway's own transaction ID, used to look up at Gateway's side
	 * @property {string} locale locale code
	 * @property {string} merchant merchant ID, should be same with checkout request
	 * @property {string} message Approve or error message from gateway
	 * @property {string} orderId merchant's order ID, should be same with checkout request
	 * @property {string} responseCode response code, payment has errors if it is non-zero
	 * @property {string} secureHash checksum of the returned data, used to verify data integrity
	 * @property {string} transactionId merchant's transaction ID, should be same with checkout request
	 * @property {string} version should be same with checkout request
	 *
	 * @property {string} vpc_3DSECI e.g: 06
	 * @property {string} vpc_3DSenrolled e.g: N
	 * @property {string} vpc_3DSXID e.g: zklRMXTS2puX%2Btj0DwOJyq6T6s8%3D
	 * @property {string} vpc_AcqAVSRespCode e.g: Unsupported
	 * @property {string} vpc_AcqCSCRespCode e.g: Unsupported
	 * @property {string} vpc_AcqResponseCode e.g: 00
	 * @property {string} vpc_Amount e.g: 200000
	 * @property {string} vpc_AuthorizeId e.g: 523190
	 * @property {string} vpc_AVS_City e.g: Hanoi
	 * @property {string} vpc_AVS_Country e.g: VNM
	 * @property {string} vpc_AVS_PostCode e.g: 10000
	 * @property {string} vpc_AVS_StateProv e.g: Hoan+Kiem
	 * @property {string} vpc_AVS_Street01 e.g: 194+Tran+Quang+Khai
	 * @property {string} vpc_AVSRequestCode e.g: Z
	 * @property {string} vpc_AVSResultCode e.g: Unsupported
	 * @property {string} vpc_BatchNo e.g: 20180116
	 * @property {string} vpc_Card e.g: VC
	 * @property {string} vpc_CardLevelIndicator e.g: 88
	 * @property {string} vpc_CardNum e.g: 400555xxxxxx0001
	 * @property {string} vpc_Command e.g: pay
	 * @property {string} vpc_CommercialCard e.g: U
	 * @property {string} vpc_CommercialCardIndicator e.g: 3
	 * @property {string} vpc_CSCResultCode e.g: Unsupported
	 * @property {string} vpc_Locale e.g: en_VN
	 * @property {string} vpc_MarketSpecificData e.g: 8
	 * @property {string} vpc_Merchant e.g: TESTONEPAY
	 * @property {string} vpc_MerchTxnRef e.g: TEST_1516078223875-387026611
	 * @property {string} vpc_Message e.g: Approved
	 * @property {string} vpc_OrderInfo e.g: TEST_1516078223875-387026611
	 * @property {string} vpc_ReceiptNo e.g: 801615523190
	 * @property {string} vpc_ReturnACI e.g: 8
	 * @property {string} vpc_RiskOverallResult e.g: ACC
	 * @property {string} vpc_SecureHash e.g: 0375408701C885CA396ED9A085D0E79B7D5437CD2FC021A96E3703787CC2874C
	 * @property {string} vpc_TransactionIdentifier e.g: 1234567890123456789
	 * @property {string} vpc_TransactionNo e.g: 62267
	 * @property {string} vpc_TxnResponseCode e.g: 0
	 * @property {string} vpc_VerSecurityLevel e.g: 06
	 * @property {string} vpc_Version e.g: 2
	 * @property {string} vpc_VerStatus e.g: E
	 * @property {string} vpc_VerType e.g: 3DS
	 */
	/**
	 * Verify return query string from OnePay using enclosed vpc_SecureHash string
	 * <br>
	 * _Hàm thực hiện xác minh tính đúng đắn của các tham số trả về từ onepay Payment_
	 *
	 * @param {*} query
	 * @returns { Promise<OnePayInternationalReturnObject> } Promise object which resolved with normalized returned data object, with additional fields like isSuccess. <br> _Promise khi hoàn thành sẽ trả về object data từ cổng thanh toán, được chuẩn hóa tên theo camelCase và đính kèm thuộc tính isSuccess_
	 */
	verifyReturnUrl(query) {
		return super.verifyReturnUrl(query).then(verifyResults => {
			const returnObject = {
				// these are common normalized properties, others are kept as is
				amount: parseInt(query.vpc_Amount, 10) / 100,
				billingCity: query.vpc_AVS_City,
				billingCountry: query.vpc_AVS_Country,
				billingPostCode: query.vpc_AVS_PostCode,
				billingStateProvince: query.vpc_AVS_StateProv,
				billingStreet: query.vpc_AVS_Street01,
				card: query.vpc_Card,
				command: query.vpc_Command,
				currencyCode: 'VND', // no Currency Code return from OnePay, it is hardcoded
				gatewayTransactionNo: query.vpc_TransactionNo,
				locale: query.vpc_Locale,
				merchant: query.vpc_Merchant,
				message: query.vpc_Message,
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

//
/**
 * The schema is based on field data requirements from OnePay's dev document
 *
 * @typedef {SimpleSchema} OnePayInternationalCheckoutSchema
 */
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
	returnUrl            : { type: String, max: 255, regEx: urlRegExp }, // NOTE: returnURL is documented with 64 chars limit but seem not a hard limit, and 64 is too few in some scenario
	title                : { type: String, optional: true, max: 255 }, // NOTE: no max limit documented for this field, this is just a safe value
	transactionId        : { type: String, max: 34 },
	vpcAccessCode        : { type: String, max: 8 },
	vpcCommand           : { type: String, max: 16 },
	vpcMerchant          : { type: String, max: 16 },
	vpcVersion           : { type: String, max: 2 },
});

/**
 * OnePayInternational test config
 *
 * _Cấu hình dùng thử OnePayInternational_
 */
OnePayInternational.TEST_CONFIG = {
	accessCode: '6BEB2546',
	merchant: 'TESTONEPAY',
	paymentGateway: 'https://mtf.onepay.vn/vpcpay/vpcpay.op',
	secureSecret: '6D0870CDE5F24F34F3915FB0045120DB',
};

export { OnePayInternational };
