// Type definitions for vn-payments 1.0.1
// Project: node-vn-payments
// Definitions by: Nau Studio team <dev@naustud.io>

/**
 * SimpleSchema from `simpl-schema` npm package
 */
declare class SimpleSchema {}

/**
 * This is the base class for OnePay's domestic and intl payment gateways
 * which bear the common hashing algorithym.
 * It should not be used alone.
 *
 * _Đây là class cơ sở cho OnePayDomestic và OnePayInternational, chỉ chứa các thuật toán mã hóa chung.
 * Lớp này không nên được sử dụng để khai báo._
 * @private
 */
declare class OnePay {
	/**
	 * OnePay configSchema
	 * @type {SimpleSchema}
	 */
	static configSchema: SimpleSchema;
	/**
	 * '2'
	 * @type {string}
	 */
	static VERSION: string;
	/**
	 * 'pay'
	 * @type {string}
	 */
	static COMMAND: string;
	/**
	 * onepay only support 'VND'
	 * @type {string}
	 */
	static CURRENCY_VND: string;
	/**
	 * 'en'
	 * @type {string}
	 */
	static LOCALE_EN: string;
	/**
	 * 'vn'
	 * @type {string}
	 */
	static LOCALE_VN: string;

	/**
	 * Instantiate a OnePay checkout helper
	 *
	 * _Khởi tạo class thanh toán OnePay_
	 * @param  {OnePayConfig} config check OnePay.configSchema for data type requirements
	 * @return {void}
	 */
	constructor(config: onepay.OnePayConfig, type?: string);

	/**
	 * Build checkout URL to redirect to the payment gateway.
	 *
	 * _Hàm xây dựng url để redirect qua OnePay gateway, trong đó có tham số mã hóa (còn gọi là public key)._
	 *
	 * @param  {OnePayCheckoutPayload} payload Object that contains needed data for the URL builder. _Đối tượng chứa các dữ liệu cần thiết để thiết lập đường dẫn._
	 * @return {Promise<URL>} buildCheckoutUrl promise
	 */
	buildCheckoutUrl(payload: onepay.OnePayCheckoutPayload): Promise<URL>;

	/**
	 * Validate checkout payload against specific schema. Throw ValidationErrors if invalid against checkoutSchema
	 * Build the schema in subclass.
	 *
	 * _Kiểm tra tính hợp lệ của dữ liệu thanh toán dựa trên schema đã được đồng bộ với tài liệu của nhà cung cấp.
	 * Hiển thị lỗi nếu không hợp lệ với checkoutSchema.
	 * Schema sẽ được tạo trong class con._
	 * @param {OnePayCheckoutPayload} payload
	 */
	validateCheckoutPayload(payload: onepay.OnePayCheckoutPayload): void;

	/**
	 * Return default checkout Payloads
	 *
	 * _Lấy checkout payload mặc định cho cổng thanh toán này_
	 * @type {OnePayCheckoutPayload}
	 */
	checkoutPayloadDefaults: onepay.OnePayCheckoutPayload;

	/**
	 * Verify return query string from OnePay using enclosed vpc_SecureHash string
	 *
	 * _Hàm thực hiện xác minh tính đúng đắn của các tham số trả về từ OnePay Payment_
	 *
	 * @param  {object} query Query data object from GET handler (`response.query`). <br> _Object query trả về từ GET handler_
	 * @return {Promise<OnePayDomesticReturnObject>} Promise object which resolved with normalized returned data object, with additional fields like isSuccess. <br> _Promise khi hoàn thành sẽ trả về object data từ cổng thanh toán, được chuẩn hóa tên theo camelCase và đính kèm thuộc tính isSuccess_
	 */
	verifyReturnUrl(query: object): Promise<onepay.OnePayDomesticReturnObject>;
}

/**
 * OnePay Domestic payment gateway helper.
 * Supports VN domestic ATM cards.
 *
 * _Class hỗ trợ cổng thanh toán nội địa OnePay._
 * _Hỗ trợ thẻ ATM nội địa._
 *
 * @extends OnePay
 */
declare class OnePayDomestic extends OnePay {
	/**
	 * OnePayDomestic test configs
	 *
	 * _Config test thử OnePay Domestic._
	 */
	static TEST_CONFIG: object;

	/**
	 * Get error status as string from response code.
	 *
	 * _Lấy chuỗi chứa trạng thái lỗi tương đương với mã response code_
	 *
	 * @param {*} responseCode Responde code from gateway <br> _Mã trả về từ cổng thanh toán._
	 * @param {*} locale Same locale at the buildCheckoutUrl. Note, 'vn' for Vietnamese. <br> _Cùng nơi với hàm buildCheckoutUrl. Lưu ý, Việt Nam là 'vn'_
	 * @return {string} A string contains error status converted from response code. <br> _Một chuỗi chứa trạng thái lỗi được chuyển lại từ response code_
	 */
	static getReturnUrlStatus(responseCode: Object, locale: string): string;

	/**
	 * Instantiate a OnePayDomestic checkout helper
	 *
	 * _Khởi tạo instance thanh toán OnePayDomestic_
	 * @param  {Object} config check OnePay.configSchema for data type requirements. <br> _Xem OnePay.configSchema để biết yêu cầu kiểu dữ liệu_
	 * @return {void}
	 */
	constructor(config: onepay.OnePayConfig);

	/**
	 * Validate checkout payload against specific schema. Throw **ValidationErrors** if invalid against checkoutSchema.
	 * Called internally by **buildCheckoutUrl**
	 *
	 * _Kiểm tra tính hợp lệ của dữ liệu thanh toán dựa trên schema đã được đồng bộ với tài liệu của nhà cung cấp.
	 * Hiển thị lỗi nếu không hợp lệ với **checkoutSchema**. Được gọi bên trong **buildCheckoutUrl**_
	 * @param {OnePayCheckoutPayload} payload
	 * @override
	 */
	validateCheckoutPayload(payload: onepay.OnePayCheckoutPayload): void;

	/**
	 * Default checkout payload object
	 *
	 * _Checkout payload mặc định cho cổng thanh toán này_
	 * @type {OnePayCheckoutPayload}
	 */
	checkoutPayloadDefaults: onepay.OnePayCheckoutPayload;

	/**
	 * Verify return query string from OnePay using enclosed vpc_SecureHash string
	 *
	 * _Hàm thực hiện xác minh tính đúng đắn của các tham số trả về từ cổng thanh toán_
	 *
	 * @param {*} query Query data object from GET handler (`response.query`). <br> _Object query trả về từ GET handler_
	 * @returns { Promise<OnePayDomesticReturnObject> } Promise object which resolved with normalized returned data object, with additional fields like isSuccess. <br> _Promise khi hoàn thành sẽ trả về object data từ cổng thanh toán, được chuẩn hóa tên theo camelCase và đính kèm thuộc tính isSuccess_
	 */
	verifyReturnUrl(query: Promise<onepay.OnePayDomesticReturnObject>): Promise<onepay.OnePayDomesticReturnObject>;
}

export { OnePayDomestic };

declare class OnePayInternational extends OnePay {
	/**
	 * OnePayDomestic test configs
	 *
	 * _Config test thử OnePay Domestic._
	 */
	static TEST_CONFIG: object;

	/**
	 * Get error status as string from response code.
	 *
	 * _Lấy chuỗi chứa trạng thái lỗi tương đương với mã response code_
	 * @param {*} responseCode Responde code from gateway
	 * @param {*} locale Same locale at the buildCheckoutUrl. Note, 'vn' for Vietnamese
	 * @return {string} Localized status string from the response code
	 */
	static getReturnUrlStatus(responseCode: Object, locale: string): string;

	/**
	 * Instantiate a OnePayInternational checkout helper
	 *
	 * _Khởi tạo instance thanh toán OnePayInternational_
	 * @param  {Object} config check OnePay.configSchema for data type requirements. <br> _Xem OnePay.configSchema để biết yêu cầu kiểu dữ liệu_
	 * @return {void}
	 */
	constructor(config: onepay.OnePayConfig);

	/**
	 * Validate checkout payload against specific schema. Throw **ValidationErrors** if invalid against checkoutSchema.
	 * Called internally by **buildCheckoutUrl**
	 *
	 * _Kiểm tra tính hợp lệ của dữ liệu thanh toán dựa trên schema đã được đồng bộ với tài liệu của nhà cung cấp.
	 * Hiển thị lỗi nếu không hợp lệ với **checkoutSchema**. Được gọi bên trong **buildCheckoutUrl**_
	 * @param {OnePayCheckoutPayload} payload
	 * @override
	 */
	validateCheckoutPayload(payload: onepay.OnePayCheckoutPayload): void;

	/**
	 * Return default checkout Payloads
	 *
	 * _Lấy checkout payload mặc định cho cổng thanh toán này_
	 * @return {OnePayCheckoutPayload} default payload object <br> _Dữ liệu mặc định của đối tượng_
	 */
	checkoutPayloadDefaults: onepay.OnePayCheckoutPayload;

	/**
	 * Verify return query string from OnePay using enclosed vpc_SecureHash string
	 *
	 * _Hàm thực hiện xác minh tính đúng đắn của các tham số trả về từ onepay Payment_
	 *
	 * @param {*} query
	 * @returns { Promise<OnePayInternationalReturnObject> } Promise object which resolved with normalized returned data object, with additional fields like isSuccess. <br> _Promise khi hoàn thành sẽ trả về object data từ cổng thanh toán, được chuẩn hóa tên theo camelCase và đính kèm thuộc tính isSuccess_
	 */
	verifyReturnUrl(query: onepay.OnePayInternationalReturnObject): Promise<onepay.OnePayInternationalReturnObject>;
}

export { OnePayInternational };

declare namespace onepay {
	export interface OnePayConfig {
		/**
		 * Merchant access code
		 */
		accessCode: string;
		/**
		 * Unique merchant code assigned by OnePay
		 */
		merchant: string;
		/**
		 * Gateway URL to redirect provided by payment provider
		 */
		paymentGateway: string;
		/**
		 * Merchant's secure secret
		 */
		secureSecret: string;
	}
	export interface OnePayCheckoutPayload {
		/**
		 * optional: true, max: 64, regEx: urlRegExp
		 */
		againLink?: string;

		/**
		 * The amount to be paid. max: 9999999999. <br> _Khoản tiền cần thanh toán_
		 */
		amount: number;
		/**
		 * optional: true, max: 64
		 */
		billingCity?: string;
		/**
		 * optional: true, max: 2
		 */
		billingCountry?: string;
		/**
		 * optional: true, max: 64
		 */
		billingPostCode?: string;
		/**
		 * optional: true, max: 64
		 */
		billingStateProvince?: string;
		/**
		 * optional: true, max: 64
		 */
		billingStreet?: string;
		/**
		 * max: 15
		 */
		clientIp: string;
		/**
		 * allowedValues: ['VND']
		 */
		currency: string;
		/**
		 * optional: true, max: 24, regEx: SimpleSchema.RegEx.Email
		 */
		customerEmail?: string;
		/**
		 * optional: true, max: 64
		 */
		customerId?: string;
		/**
		 * optional: true, max: 16
		 */
		customerPhone?: string;
		/**
		 * optional: true, max: 64
		 */
		deliveryAddress?: string;
		/**
		 * optional: true, max: 64
		 */
		deliveryCity?: string;
		/**
		 * optional: true, max: 8
		 */
		deliveryCountry?: string;
		/**
		 * optional: true, max: 64
		 */
		deliveryProvince?: string;
		/**
		 * allowedValues: ['vn', 'en']
		 */
		locale: string;
		/**
		 * max: 32
		 */
		orderId: string;
		/**
		 * max: 255, regEx: urlRegExp. <br>
		 * NOTE: returnURL is documented with 64 chars limit but seem not a hard limit, and 64 is too few in some scenar
		 */
		returnUrl: string;
		/**
		 * optional: true, max: 255. <br>
		 * NOTE: no max limit documented for this field, this is just a safe val
		 */
		title?: string;
		/**
		 * max: 34
		 */
		transactionId: string;
		/**
		 * max: 8
		 */
		vpcAccessCode?: string;
		/**
		 * max: 16
		 */
		vpcCommand: string;
		/**
		 * max: 16
		 */
		vpcMerchant?: string;
		/**
		 * max: 2
		 */
		vpcVersion?: string;
	}

	export interface OnePayDomesticReturnObject {
		/**
		 * whether the payment succeeded or not
		 */
		isSuccess: boolean;
		/**
		 * amount paid by customer, already divided by 100
		 */
		amount: number;
		/**
		 * should be same with checkout request
		 */
		command: string;
		/**
		 * currency code, should be same with checkout request
		 */
		currencyCode: string;
		/**
		 * Gateway's own transaction ID, used to look up at Gateway's side
		 */
		gatewayTransactionNo: string;
		/**
		 * locale code, should be same with checkout request
		 */
		locale: string;
		/**
		 * merchant ID, should be same with checkout request
		 */
		merchant: string;
		/**
		 * Approve or error message based on response code
		 */
		message: string;
		/**
		 * merchant's order ID, should be same with checkout request
		 */
		orderId: string;
		/**
		 * response code, payment has errors if it is non-zero
		 */
		responseCode: string;
		/**
		 * checksum of the returned data, used to verify data integrity
		 */
		secureHash: string;
		/**
		 * merchant's transaction ID, should be same with checkout request
		 */
		transactionId: string;
		/**
		 * should be same with checkout request
		 */
		version: string;
		/**
		 * e.g: 970436
		 */
		vpc_AdditionData?: string;
		/**
		 * e.g: 1000000
		 */
		vpc_Amount?: string;
		/**
		 * e.g: pay
		 */
		vpc_Command?: string;
		/**
		 * e.g: VND
		 */
		vpc_CurrencyCode?: string;
		/**
		 * e.g: vn
		 */
		vpc_Locale?: string;
		/**
		 * e.g: ONEPAY
		 */
		vpc_Merchant?: string;
		/**
		 * e.g: TEST_15160802610161733380665
		 */
		vpc_MerchTxnRef?: string;
		/**
		 * e.g: TEST_15160802610161733380665
		 */
		vpc_OrderInfo?: string;
		/**
		 * e.g: B5CD330E2DC1B1C116A068366F69717F54AD77E1BE0C40E4E3700551BE9D5004
		 */
		vpc_SecureHash?: string;
		/**
		 * e.g: 1618136
		 */
		vpc_TransactionNo?: string;
		/**
		 * e.g: 0
		 */
		vpc_TxnResponseCode?: string;
		/**
		 * e.g: 2
		 */
		vpc_Version?: string;
	}

	export interface OnePayInternationalReturnObject {
		/**
		 * whether the payment succeeded or not
		 */
		isSuccess: boolean;
		/**
		 * amount paid by customer, already divided by 100
		 */
		amount: number;
		/**
		 * should be same with checkout request
		 */
		command: string;
		/**
		 * currency code, should be same with checkout request
		 */
		currencyCode: string;
		/**
		 * Gateway's own transaction ID, used to look up at Gateway's side
		 */
		gatewayTransactionNo: string;
		/**
		 * locale code, should be same with checkout request
		 */
		locale: string;
		/**
		 * merchant ID, should be same with checkout request
		 */
		merchant: string;
		/**
		 * Approve or error message based on response code
		 */
		message: string;
		/**
		 * merchant's order ID, should be same with checkout request
		 */
		orderId: string;
		/**
		 * response code, payment has errors if it is non-zero
		 */
		responseCode: string;
		/**
		 * checksum of the returned data, used to verify data integrity
		 */
		secureHash: string;
		/**
		 * merchant's transaction ID, should be same with checkout request
		 */
		transactionId: string;
		/**
		 * should be same with checkout request
		 */
		version: string;
		/**
		 * e.g: 970436
		 */
		vpc_AdditionData?: string;
		/**
		 * e.g: 1000000
		 */
		vpc_Amount?: string;
		/**
		 * e.g: pay
		 */
		vpc_Command?: string;
		/**
		 * e.g: vn
		 */
		vpc_Locale?: string;
		/**
		 * e.g: ONEPAY
		 */
		vpc_Merchant?: string;
		/**
		 * e.g: TEST_15160802610161733380665
		 */
		vpc_MerchTxnRef?: string;
		/**
		 * e.g: TEST_15160802610161733380665
		 */
		vpc_OrderInfo?: string;
		/**
		 * e.g: B5CD330E2DC1B1C116A068366F69717F54AD77E1BE0C40E4E3700551BE9D5004
		 */
		vpc_SecureHash?: string;
		/**
		 * e.g: 1618136
		 */
		vpc_TransactionNo?: string;
		/**
		 * e.g: 0
		 */
		vpc_TxnResponseCode?: string;
		/**
		 * e.g: 2
		 */
		vpc_Version?: string;
		/**
		 * billing address' city
		 */
		billingCity: string;
		/**
		 *  billing address' country
		 */
		billingCountry: string;
		/**
		 * billing address' post code
		 */
		billingPostCode: string;
		/**
		 * billing address' state or province
		 */
		billingStateProvince: string;
		/**
		 * billing address and street name
		 */
		billingStreet: string;
		/**
		 * type of card used to pay, VC, MC, JC, AE
		 */
		card: string;
		/**
		 * e.g: 06
		 */
		vpc_3DSECI: string;
		/**
		 * e.g: N
		 */
		vpc_3DSenrolled: string;
		/**
		 * e.g: zklRMXTS2puX%2Btj0DwOJyq6T6s8%3D
		 */
		vpc_3DSXID: string;
		/**
		 * e.g: Unsupported
		 */
		vpc_AcqAVSRespCode: string;
		/**
		 * e.g: Unsupported
		 */
		vpc_AcqCSCRespCode: string;
		/**
		 * e.g: 00
		 */
		vpc_AcqResponseCode: string;
		/**
		 * e.g: 523190
		 */
		vpc_AuthorizeId: string;
		/**
		 * e.g: Hanoi
		 */
		vpc_AVS_City: string;
		/**
		 * e.g: VNM
		 */
		vpc_AVS_Country: string;
		/**
		 * e.g: 10000
		 */
		vpc_AVS_PostCode: string;
		/**
		 * e.g: Hoan+Kiem
		 */
		vpc_AVS_StateProv: string;
		/**
		 * e.g: 194+Tran+Quang+Khai
		 */
		vpc_AVS_Street01: string;
		/**
		 * e.g: Z
		 */
		vpc_AVSRequestCode: string;
		/**
		 * e.g: Unsupported
		 */
		vpc_AVSResultCode: string;
		/**
		 * e.g: 20180116
		 */
		vpc_BatchNo: string;
		/**
		 * e.g: VC
		 */
		vpc_Card: string;
		/**
		 * e.g: 88
		 */
		vpc_CardLevelIndicator: string;
		/**
		 * e.g: 400555xxxxxx0001
		 */
		vpc_CardNum: string;
		/**
		 * e.g: U
		 */
		vpc_CommercialCard: string;
		/**
		 * e.g: 3
		 */
		vpc_CommercialCardIndicator: string;
		/**
		 * e.g: Unsupported
		 */
		vpc_CSCResultCode: string;
		/**
		 * e.g: 8
		 */
		vpc_MarketSpecificData: string;
		/**
		 * e.g: Approved
		 */
		vpc_Message: string;
		/**
		 * e.g: 801615523190
		 */
		vpc_ReceiptNo: string;
		/**
		 * e.g: 8
		 */
		vpc_ReturnACI: string;
		/**
		 * e.g: ACC
		 */
		vpc_RiskOverallResult: string;
		/**
		 * e.g: 1234567890123456789
		 */
		vpc_TransactionIdentifier: string;
		/**
		 * e.g: 06
		 */
		vpc_VerSecurityLevel: string;
		/**
		 * e.g: E
		 */
		vpc_VerStatus: string;
		/**
		 * e.g: 3DS
		 */
		vpc_VerType: string;
	}
}

/**
 * Ngan Luong payment gateway helper.
 *
 * _Class hỗ trợ thanh toán qua Ngân Lượng._
 *
 */
declare class NganLuong {
	/**
	 * NganLuong configSchema
	 */
	static configSchema: SimpleSchema;

	/**
	 * NganLuong dataSchema
	 */
	static dataSchema: SimpleSchema;

	/**
	 * NganLuong API Version
	 */
	static VERSION: string;

	/**
	 * NganLuong API command string
	 */
	static COMMAND: string;

	/**
	 * NganLuong VND currency code
	 */
	static CURRENCY_VND: string;

	/**
	 * NganLuong English locale code
	 */
	static LOCALE_EN: string;

	/**
	 * NganLuong Vietnamese locale code
	 */
	static LOCALE_VN: string;

	/**
	 * NganLuong test configs
	 *
	 * _Config test thử Ngân Lượng_
	 */
	static TEST_CONFIG: object;

	/**
	 * Instantiate a NganLuong checkout helper
	 *
	 * _Khởi tạo instance thanh toán NganLuong_
	 *
	 * @param  {Object} config check NganLuong.configSchema for data type requirements. <br> _Xem NganLuong.configSchema để biết yêu cầu kiểu dữ liệu_
	 * @return {void}
	 */
	constructor(config: nganluong.NganLuongConfig);

	/**
	 * Build checkoutUrl to redirect to the payment gateway
	 *
	 * _Hàm xây dựng url để redirect qua NganLuong gateway, trong đó có tham số mã hóa (còn gọi là public key)_
	 *
	 * @param  {NganLuongCheckoutPayload} payload Object that contains needed data for the URL builder, refer to typeCheck object above. <br> _Đối tượng chứa các dữ liệu cần thiết để thiết lập đường dẫn._
	 * @return {Promise<URL>} buildCheckoutUrl promise
	 */
	buildCheckoutUrl(payload: nganluong.NganLuongCheckoutPayload): Promise<URL>;

	/**
	 * Validate checkout payload against specific schema. Throw ValidationErrors if invalid against checkoutSchema
	 *
	 * _Kiểm tra tính hợp lệ của dữ liệu thanh toán dựa trên một cấu trúc dữ liệu cụ thể. Hiển thị lỗi nếu không hợp lệ với checkoutSchema._
	 *
	 * @param {NganLuongCheckoutPayload} payload
	 */
	validateCheckoutPayload(payload: nganluong.NganLuongCheckoutPayload): void;

	/**
	 * default payload object
	 *
	 * _checkout payload mặc định_
	 * @type {NganLuongCheckoutPayload}
	 */
	checkoutPayloadDefaults: nganluong.NganLuongCheckoutPayload;

	/**
	 * Verify return query string from NganLuong using enclosed vnp_SecureHash string
	 *
	 * _Hàm thực hiện xác minh tính đúng đắn của các tham số trả về từ cổng thanh toán_
	 *
	 * @param  {Object} query Query data object from GET handler (`response.query`). <br> _Dữ liệu được trả về từ GET handler (`response.query`)_
	 * @return {Promise<nganluong.NganLuongReturnObject>}
	 */
	verifyReturnUrl(query: object): Promise<nganluong.NganLuongReturnObject>;
}

export { NganLuong };

declare namespace nganluong {
	export interface NganLuongConfig {
		/**
		 * NganLuong payment gateway (API Url to send payment request)
		 *
		 */
		paymentGateway: string;
		/**
		 * NganLuong merchant id
		 */
		merchant: string;
		/**
		 * NganLuong receiver email, who will receive the money (usually is merchant email)
		 */
		receiverEmail: string;
		/**
		 * NganLuong merchant secret string
		 */
		secureSecret: string;
	}

	export interface NganLuongCheckoutPayload {
		/**
		 * optional: true
		 */
		createdDate?: string;
		/**
		 *   The payment mount
		 */
		amount: number;
		/**
		 *  optional: true, max: 16
		 */
		clientIp?: string;
		/**
		 *   allowedValues: ['vnd', 'VND', 'USD', 'usd']
		 */
		currency: string;
		/**
		 *   optional: true, max: 255
		 */
		billingCity?: string;
		/**
		 *   optional: true, max: 255
		 */
		billingCountry?: string;
		/**
		 *   optional: true, max: 255
		 */
		billingPostCode?: string;
		/**
		 *   optional: true, max: 255
		 */
		billingStateProvince?: string;
		/**
		 *   optional: true, max: 255
		 */
		billingStreet?: string;
		/**
		 *   optional: true, max: 255
		 */
		customerId?: string;
		/**
		 *   optional: true, max: 255
		 */
		deliveryAddress?: string;
		/**
		 *   optional: true, max: 255
		 */
		deliveryCity?: string;
		/**
		 *   optional: true, max: 255
		 */
		deliveryCountry?: string;
		/**
		 *   optional: true, max: 255
		 */
		deliveryProvince?: string;
		/**
		 *   allowedValues: ['vi', 'en']
		 */
		locale: string;
		/**
		 *   max: 34
		 */
		orderId: string;
		/**
		 *   max: 255, regEx: SimpleSchema.RegEx.Email
		 */
		receiverEmail: string;
		/**
		 *   allowedValues: ['NL', 'VISA', 'MASTER', 'JCB', 'ATM_ONLINE', 'ATM_OFFLINE', 'NH_OFFLINE', 'TTVP', 'CREDIT_CARD_PREPAID', 'IB_ONLINE']
		 */
		paymentMethod: string;
		/**
		 *   optional: true, max: 50 (required with method ATM_ONLINE, ATM_OFFLINE, NH_OFFLINE, CREDIT_CARD_PREPAID)
		 */
		bankCode?: string;
		/**
		 *   optional: true, allowedValues: ['1', '2']
		 */
		paymentType?: string;
		/**
		 *   optional: true, max: 500
		 */
		orderInfo?: string;
		/**
		 *   Integer, optional: true
		 */
		taxAmount?: number;
		/**
		 *  Integer, optional: true
		 */
		discountAmount?: number;
		/**
		 *  Integer, optional: true
		 */
		feeShipping?: number;
		/**
		 *  max: 255, regEx: SimpleSchema.RegEx.Email
		 */
		customerEmail: string;
		/**
		 *   max: 255
		 */
		customerPhone: string;
		/**
		 *   max: 255
		 */
		customerName: string;
		/**
		 *   max: 255
		 */
		returnUrl: string;
		/**
		 *   max: 255, optional: true
		 */
		cancelUrl?: string;
		/**
		 *   Integer, optional: true; minutes
		 */
		timeLimit?: number;
		/**
		 *  max: 255, optional: true
		 */
		affiliateCode?: string;
		/**
		 *   optional: true
		 */
		totalItem?: string;
		/**
		 *   max: 40
		 */
		transactionId: string;
		/**
		 *   max: 32
		 */
		nganluongSecretKey: string;
		/**
		 *   max: 16
		 */
		nganluongMerchant: string;
		/**
		 *   max: 32
		 */
		nganluongCommand: string;
		/**
		 *   max: 3
		 */
		nganluongVersion: string;
		/**
		 *   regEx: SimpleSchema.RegEx.Url
		 */
		paymentGateway: string;
		/**
		 *
		 */
		merchant: string;
		/**
		 *
		 */
		secureSecret: string;
	}

	export interface NganLuongReturnObject {
		/**
		 * whether the payment succeeded or not
		 */
		isSuccess: boolean;
		/**
		 * Approve or error message based on response code
		 */
		message: string;
		/**
		 * merchant ID, should be same with checkout request
		 */
		merchant: string;
		/**
		 * merchant's transaction ID, should be same with checkout request
		 */
		transactionId: string;
		/**
		 * amount paid by customer
		 */
		amount: string;
		/**
		 * order info, should be same with checkout request
		 */
		orderInfo: string;
		/**
		 * response code, payment has errors if it is non-zero
		 */
		responseCode: string;
		/**
		 * bank code of the bank where payment was occurred
		 */
		bankCode: string;
		/**
		 * Gateway's own transaction ID, used to look up at Gateway's side
		 */
		gatewayTransactionNo: string;
		/**
		 * e.g: '00'
		 */
		error_code: string;
		/**
		 * e.g: '43614-fc2a3698ee92604d5000434ed129d6a8'
		 */
		token: string;
		/**
		 * e.g: ''
		 */
		description: string;
		/**
		 * e.g: '00'
		 */
		transaction_status: string;
		/**
		 * e.g: 'tung.tran@naustud.io'
		 */
		receiver_email: string;
		/**
		 * e.g: 'adidas'
		 */
		order_code: string;
		/**
		 * e.g: '90000'
		 */
		total_amount: string;
		/**
		 * e.g: 'ATM_ONLINE'
		 */
		payment_method: string;
		/**
		 * e.g: 'BAB'
		 */
		bank_code: string;
		/**
		 * e.g: '2'
		 */
		payment_type: string;
		/**
		 * e.g: 'Test'
		 */
		order_description: string;
		/**
		 * e.g: '0'
		 */
		tax_amount: string;
		/**
		 * e.g: '0'
		 */
		discount_amount: string;
		/**
		 * e.g: '0'
		 */
		fee_shipping: string;
		/**
		 * e.g: 'http%3A%2F%2Flocalhost%3A8080%2Fpayment%2Fnganluong%2Fcallback'
		 */
		return_url: string;
		/**
		 * e.g: 'http%3A%2F%2Flocalhost%3A8080%2F'
		 */
		cancel_url: string;
		/**
		 * e.g: 'Nguyen Hue'
		 */
		buyer_fullname: string;
		/**
		 * e.g: 'tu.nguyen@naustud.io'
		 */
		buyer_email: string;
		/**
		 * e.g: '0948231723'
		 */
		buyer_mobile: string;
		/**
		 * e.g: 'Test'
		 */
		buyer_address: string;
		/**
		 * e.g: ''
		 */
		affiliate_code: string;
		/**
		 * e.g: '19563733'
		 */
		transaction_id: string;
	}
}

/**
 * SohaPay payment gateway helper.
 *
 * _Class hỗ trợ thanh toán qua SohaPay_
 *
 */
declare class SohaPay {
	/**
	 * SohaPay configSchema
	 */
	static configSchema: SimpleSchema;

	/**
	 * SohaPay dataSchema
	 */
	static checkoutSchema: SimpleSchema;

	/**
	 * SohaPay API Version
	 */
	static VERSION: string;

	/**
	 * SohaPay English locale code
	 */
	static LOCALE_EN: string;

	/**
	 * SohaPay Vietnamese locale code
	 */
	static LOCALE_VN: string;

	/**
	 * SohaPay test configs
	 *
	 * _Config test thử SohaPay_
	 */
	static TEST_CONFIG: object;

	/**
	 * Instantiate a SohaPay checkout helper
	 *
	 * _Khởi tạo instance thanh toán SohaPay_
	 *
	 * @param  {Object} config check SohaPay.configSchema for data type requirements. <br> _Xem SohaPay.configSchema để biết yêu cầu kiểu dữ liệu._
	 * @return {void}
	 */
	constructor(config: sohapay.SohaPayConfig);

	/**
	 * Build checkoutUrl to redirect to the payment gateway
	 *
	 * _Hàm xây dựng url để redirect qua SohaPay gateway, trong đó có tham số mã hóa (còn gọi là public key)_
	 *
	 * @param  {NganLuongCheckoutPayload} payload Object that contains needed data for the URL builder, refer to typeCheck object above. <br> _Đối tượng chứa các dữ liệu cần thiết để thiết lập đường dẫn._
	 * @return {Promise<URL>} buildCheckoutUrl promise
	 */
	buildCheckoutUrl(payload: sohapay.SohaPayCheckoutPayload): Promise<URL>;

	/**
	 * Validate checkout payload against checkoutSchema. Throw ValidationErrors if invalid.
	 *
	 * _Kiểm tra tính hợp lệ của dữ liệu thanh toán dựa trên một cấu trúc dữ liệu cụ thể. Hiển thị lỗi nếu không hợp lệ._
	 * @param {SohaPayCheckoutPayload} payload
	 */
	validateCheckoutPayload(payload: sohapay.SohaPayCheckoutPayload): Promise<URL>;

	/**
	 * default payload object
	 *
	 * _checkout payload mặc định_
	 * @type {SohaPayCheckoutPayload}
	 */
	checkoutPayloadDefaults: sohapay.SohaPayCheckoutPayload;

	/**
	 * Verify return query string from SohaPay using enclosed secureCode string
	 *
	 * _Hàm thực hiện xác minh tính đúng đắn của các tham số trả về từ cổng thanh toán_
	 *
	 * @param  {Object} query Query data object from GET handler (`response.query`). <br> _Dữ liệu được trả về từ GET handler (`response.query`)_
	 * @return {Promise<sohapay.SohaPayReturnObject>}
	 */
	verifyReturnUrl(query: object): Promise<sohapay.SohaPayReturnObject>;
}

export { SohaPay };

declare namespace sohapay {
	export interface SohaPayConfig {
		/**
		 * SohaPay merchant id
		 */
		merchantCode: string;
		/**
		 * SohaPay payment gateway (API Url to send payment request)
		 */
		paymentGateway: string;
		/**
		 * SohaPay merchant secret string
		 */
		secureSecret: string;
	}

	export interface SohaPayCheckoutPayload {
		/**
		 *  max: 16
		 */
		language: string;

		/**
		 *  max: 34
		 */
		orderId: string;

		/**
		 * regEx: SimpleSchema.RegEx.Url
		 * max: 24
		 */
		customerEmail: string;

		/**
		 * max: 15
		 */
		customerPhone: string;

		/**
		 * max: 255
		 */
		returnUrl: string;

		/**
		 * max: 9999999999
		 */
		amount: number;

		/**
		 * max: 1
		 */
		paymentType: string;

		/**
		 * max: 8
		 */
		siteCode: string;

		/**
		 * max: 255
		 */
		transactionInfo: string;

		/**
		 * max: 1
		 */
		version: string;

		/**
		 * optional: true
		 * max: 2
		 */
		locale?: string;

		/**
		 * optional: true
		 * max: 4
		 */
		currency?: string;

		/**
		 * optional: true
		 * max: 64
		 */
		billingCity?: string;

		/**
		 * optional: true
		 * max: 2
		 */
		billingCountry?: string;

		/**
		 * optional: true
		 * max: 64
		 */
		billingPostCode?: string;

		/**
		 * optional: true
		 * max: 64
		 */
		billingStateProvince?: string;

		/**
		 * optional: true
		 * max: 64
		 */
		billingStreet?: string;

		/**
		 * optional: true
		 * max: 255
		 */
		deliveryAddress?: string;

		/**
		 * optional: true
		 * max: 255
		 */
		deliveryCity?: string;

		/**
		 * optional: true
		 * max: 255
		 */
		deliveryCountry?: string;

		/**
		 * optional: true
		 * max: 255
		 */
		deliveryProvince?: string;

		/**
		 * optional: true
		 * max: 15
		 */
		clientIp?: string;

		/**
		 * optional: true
		 * max: 40
		 */
		transactionId?: string;

		/**
		 * optional: true
		 * max: 40
		 */
		customerId?: string;
	}

	export interface SohaPayReturnObject {
		/**
		 * whether the payment succeeded or not
		 */
		isSuccess: boolean;

		/**
		 *
		 */
		message: string;

		/**
		 * transaction id
		 */
		transactionId: string;

		/**
		 *  customer email
		 */
		orderEmail: string;

		/**
		 *  session token came from SohaPay
		 */
		orderSession: string;

		/**
		 *  amount paid by customer
		 */
		amount: string;

		/**
		 * unique code assigned by SohaPay for merchant
		 */
		siteCode: string;

		/**
		 * response status code of SohaPay
		 */
		responseCode: string;

		/**
		 * description of the payment
		 */
		transactionInfo: string;
		/**
		 * response message from SohaPay
		 */
		responseMessage: string;

		/**
		 * checksum of the returned data, used to verify data integrity
		 */
		secureCode: string;

		/**
		 *  Error text returned from SohaPay Gateway
		 *
		 *  e.g: 'Giao dịch thanh toán bị huỷ bỏ'
		 */
		error_text: string;

		/**
		 * e.g: 'node-2018-01-19T131933.811Z'
		 */
		order_code: string;

		/**
		 *  e.g: 'dev@naustud.io'
		 */
		order_email: string;

		/**
		 * e.g: 'd3bdef93fa01cd37f7e426fa25f5d1a0'
		 */
		order_session: string;

		/**
		 * e.g: '90000'
		 */
		price: string;

		/**
		 * e.g: 'test'
		 */
		site_code: string;

		/**
		 * e.g: 'Thanh toan giay adidas'
		 */
		transaction_info: string;

		/**
		 * e.g: FC5283C6B93C1D8F9A9329293DA38FFC3204FA6CE75661972419DAA6E5A1B7B5
		 */
		secure_code: string;
	}
}

/**
 * VNPay payment gateway helper
 *
 * _Class hỗ trợ thanh toán qua VNPay_
 *
 */
declare class VNPay {
	/**
	 * VNPay configSchema
	 * @type {SimpleSchema}
	 */
	static configSchema: SimpleSchema;

	/**
	 * The schema is based on field data requirements from VNPay's dev document
	 *
	 * _Cấu trúc dữ liệu được dựa trên các yêu cầu của tài liệu VNPay_
	 * @type {SimpleSchema}
	 */
	static checkoutSchema: SimpleSchema;

	/**
	 * VNPay API version
	 */
	static VERSION: string;

	/**
	 * VNPay API command string for one time payment
	 */
	static COMMAND: string;

	/**
	 * VNPay VND currency code
	 */
	static CURRENCY_VND: string;

	/**
	 * English locale code
	 */
	static LOCALE_EN: string;

	/**
	 * Vietnamese locale code
	 */
	static LOCALE_VN: string;

	/**
	 * VNPay test configs
	 *
	 * _Config test thử VNPay_
	 */
	static TEST_CONFIG: object;

	/**
	 * Instantiate a VNPay checkout helper
	 *
	 * _Khởi tạo instance thanh toán VNPay_
	 * @param  {Object} config check VNPay.configSchema for data type requirements <br> Xem VNPay.configSchema để biết yêu cầu kiểu dữ liệu
	 * @return {void}
	 */
	constructor(config: vnpay.VNPayConfig);

	/**
	 * Build checkoutUrl to redirect to the payment gateway
	 *
	 * _Hàm xây dựng url để redirect qua VNPay gateway, trong đó có tham số mã hóa (còn gọi là public key)_
	 *
	 * @param  {VNPayCheckoutPayload} payload Object that contains needed data for the URL builder, refer to typeCheck object above <br> Đối tượng chứa các dữ liệu cần thiết để thiết lập đường dẫn.
	 * @return {Promise<URL>} buildCheckoutUrl promise
	 */
	buildCheckoutUrl(payload: vnpay.VNPayCheckoutPayload): Promise<URL>;

	/**
	 * Validate checkout payload against specific schema. Throw ValidationErrors if invalid against checkoutSchema
	 *
	 * _Kiểm tra tính hợp lệ của dữ liệu thanh toán dựa trên một cấu trúc dữ liệu cụ thể. Hiển thị lỗi nếu không hợp lệ với checkoutSchema._
	 *
	 * @param {VNPayCheckoutPayload} payload
	 */
	validateCheckoutPayload(payload: vnpay.VNPayCheckoutPayload): void;

	/**
	 * default payload object
	 *
	 * _checkout payload mặc định_
	 * @type {VNPayCheckoutPayload}
	 */
	checkoutPayloadDefaults: vnpay.VNPayCheckoutPayload;

	/**
	 * Verify return query string from VNPay using enclosed vnp_SecureHash string
	 *
	 * _Hàm thực hiện xác minh tính đúng đắn của các tham số trả về từ cổng thanh toán_
	 *
	 * @param  {Object} query Query data object from GET handler (`response.query`) <br> Dữ liệu được trả về từ GET handler (`response.query`)
	 * @return {Promise<VNPayReturnObject>}
	 */
	verifyReturnUrl(query: object): Promise<vnpay.VNPayReturnObject>;
}

export { VNPay };

declare namespace vnpay {
	export interface VNPayConfig {
		/**
		 * VNPay payment Gateway (API Url to send payment request)
		 */
		paymentGateway: string;

		/**
		 * VNPay merchant code
		 */
		merchant: string;

		/**
		 * VNPay merchant secure code
		 */
		secureSecret: string;
	}

	export interface VNPayCheckoutPayload {
		/**
		 * optional: true
		 */
		createdDate?: string;
		/**
		 *   The pay amount, Integer, max: 9999999999
		 */
		amount: number;
		/**
		 *  max: 16
		 */
		clientIp: string;
		/**
		 *   allowedValues: ['VND']
		 */
		currency: string;
		/**
		 *   optional: true, max: 255
		 */
		billingCity?: string;
		/**
		 *   optional: true, max: 255
		 */
		billingCountry?: string;
		/**
		 *   optional: true, max: 255
		 */
		billingPostCode?: string;
		/**
		 *   optional: true, max: 255
		 */
		billingStateProvince?: string;
		/**
		 *   optional: true, max: 255
		 */
		billingStreet?: string;
		/**
		 *   optional: true, max: 255, regEx: SimpleSchema.RegEx.Email
		 */
		customerEmail?: string;
		/**
		 *   optional: true, max: 255
		 */
		customerId?: string;
		/**
		 *   optional: true, max: 255
		 */
		customerPhone?: string;
		/**
		 *   optional: true, max: 255
		 */
		deliveryAddress?: string;
		/**
		 *   optional: true, max: 255
		 */
		deliveryCity?: string;
		/**
		 *   optional: true, max: 255
		 */
		deliveryCountry?: string;
		/**
		 *   optional: true, max: 255
		 */
		deliveryProvince?: string;
		/**
		 *   optional: true, max: 50
		 */
		bankCode?: string;
		/**
		 *   allowedValues: ['vn', 'en']
		 */
		locale: string;
		/**
		 *   max: 34
		 */
		orderId: string;
		/**
		 *   max: 255
		 */
		orderInfo: string;
		/**
		 *   max: 40
		 */
		orderType: string;
		/**
		 *   max: 255
		 */
		returnUrl: string;
		/**
		 *   max: 40
		 */
		transactionId: string;
		/**
		 *   max: 32
		 */
		vnpSecretKey: string;
		/**
		 *   max: 16
		 */
		vnpMerchant: string;
		/**
		 *   max: 16
		 */
		vnpCommand: string;
		/**
		 *   max: 2
		 */
		vnpVersion: string;
		/**
		 *   regEx: SimpleSchema.RegEx.Url
		 */
		paymentGateway: string;
		/**
		 *
		 */
		merchant: string;
		/**
		 *
		 */
		secureSecret: string;
	}

	export interface VNPayReturnObject {
		/**
		 * whether the payment succeeded or not
		 */
		isSuccess: string;
		/**
		 * Approve or error message based on response code
		 */
		message: string;
		/**
		 * merchant ID, should be same with checkout request
		 */
		merchant: string;
		/**
		 * merchant's transaction ID, should be same with checkout request
		 */
		transactionId: string;
		/**
		 * amount paid by customer, already divided by 100
		 */
		amount: number;
		/**
		 * order info, should be same with checkout request
		 */
		orderInfo: string;
		/**
		 * response code, payment has errors if it is non-zero
		 */
		responseCode: string;
		/**
		 * bank code of the bank where payment was occurred
		 */
		bankCode: string;
		/**
		 * bank transaction ID, used to look up at Bank's side
		 */
		bankTranNo: string;
		/**
		 * type of card
		 */
		cardType: string;
		/**
		 * date when transaction occurred
		 */
		payDate: string;
		/**
		 * Gateway's own transaction ID, used to look up at Gateway's side
		 */
		gatewayTransactionNo: string;
		/**
		 * checksum of the returned data, used to verify data integrity
		 */
		secureHash: string;
		/**
		 * e.g: COCOSIN
		 */
		vnp_TmnCode: string;
		/**
		 * e.g: node-2018-01-15T10:04:36.540Z
		 */
		vnp_TxnRef: string;
		/**
		 * e.g: 90000000
		 */
		vnp_Amount: string;
		/**
		 * e.g: Thanh toan giay adidas
		 */
		vnp_OrderInfo: string;
		/**
		 * e.g: 00
		 */
		vnp_ResponseCode: string;
		/**
		 * e.g: NCB
		 */
		vnp_BankCode: string;
		/**
		 * e.g: 20180115170515
		 */
		vnp_BankTranNo: string;
		/**
		 * e.g: ATM
		 */
		vnp_CardType: string;
		/**
		 * e.g: 20180115170716
		 */
		vnp_PayDate: string;
		/**
		 * e.g: 13008888
		 */
		vnp_TransactionNo: string;
		/**
		 * e.g: 115ad37de7ae4d28eb819ca3d3d85b20
		 */
		vnp_SecureHash: string;
	}
}
