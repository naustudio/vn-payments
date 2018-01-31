import { OnePayDomestic, OnePayInternational } from '../src/onepay';
import { OnePay } from '../src/onepay/OnePay';

describe('OnePay Base', () => {
	let onepay;

	beforeEach(() => {
		onepay = new OnePay({
			paymentGateway: 'https://mtf.onepay.vn/onecomm-pay/vpc.op',
			merchant: 'ONEPAY',
			accessCode: 'D67342C2',
			secureSecret: 'A3EFDFABA8653DF2342E8DAC29B51AF0',
		});
	});

	it('should throw errors if use directly', async () => {
		expect(() => {
			onepay.validateCheckoutPayload({});
		}).toThrow();
		await expect(onepay.buildCheckoutUrl({})).rejects;
	});
});

describe('OnePayDomestic', () => {
	let onepayDom;

	beforeEach(() => {
		onepayDom = new OnePayDomestic({
			paymentGateway: 'https://mtf.onepay.vn/onecomm-pay/vpc.op',
			merchant: 'ONEPAY',
			accessCode: 'D67342C2',
			secureSecret: 'A3EFDFABA8653DF2342E8DAC29B51AF0',
		});
	});

	describe('OnePayDomestic static properties', () => {
		it('should inherit from OnePay', () => {
			expect(OnePayDomestic.VERSION).toEqual('2');
			expect(OnePayDomestic.COMMAND).toEqual('pay');
			expect(OnePayDomestic.CURRENCY_VND).toEqual('VND');
			expect(OnePayDomestic.LOCALE_EN).toEqual('en');
			expect(OnePayDomestic.LOCALE_VN).toEqual('vn');
		});
	});

	describe('OnePayDomestic.buildCheckoutUrl', () => {
		it('should return correct payment request URL all details', async () => {
			// we'll use this demo URL from OnePay developer website for authenticity
			// https://mtf.onepay.vn/onecomm-pay/vpc.op?Title=onepay+paygate&vpc_AccessCode=D67342C2&vpc_Amount=100&vpc_Command=pay&vpc_Currency=VND&vpc_Customer_Email=support%40onepay.vn&vpc_Customer_Id=thanhvt&vpc_Customer_Phone=840904280949&vpc_Locale=vn&vpc_MerchTxnRef=2018-01-11T14%3A46%3A11.115Z&vpc_Merchant=ONEPAY&vpc_OrderInfo=2018-01-11T14%3A46%3A11.115Z&vpc_ReturnURL=http%3A%2F%2Flocalhost%2F%7Ethanh%2Fnoidia_php%2Fdr.php&vpc_SHIP_City=Ha+Noi&vpc_SHIP_Country=Viet+Nam&vpc_SHIP_Provice=Hoan+Kiem&vpc_SHIP_Street01=39A+Ngo+Quyen&vpc_TicketNo=127.0.0.1&vpc_Version=2&vpc_SecureHash=DDC85640D5B2D72AC46A16FBCD3E0DF7B4E05DB1818E2A0A423C2A31FAFF39E4
			const checkoutPayload = {
				title: 'onepay paygate',
				amount: 1,
				clientIp: '127.0.0.1',
				locale: 'vn',
				// billingCity: '',
				// billingCountry: '',
				// billingPostCode: '',
				// billingStateProvince: '',
				// billingStreet: '',
				currency: 'VND',
				deliveryAddress: '39A Ngo Quyen',
				deliveryCity: 'Ha Noi',
				deliveryCountry: 'Viet Nam',
				deliveryProvince: 'Hoan Kiem',
				customerEmail: 'support@onepay.vn',
				customerPhone: '840904280949',
				orderId: '2018-01-11T14:46:11.115Z',
				returnUrl: 'http://localhost/~thanh/noidia_php/dr.php',
				transactionId: '2018-01-11T14:46:11.115Z',
				customerId: 'thanhvt',
			};

			const redirectUrl = await onepayDom.buildCheckoutUrl(checkoutPayload);

			expect(redirectUrl.searchParams.get('vpc_SecureHash')).toEqual(
				'DDC85640D5B2D72AC46A16FBCD3E0DF7B4E05DB1818E2A0A423C2A31FAFF39E4'
			);
		});

		it('should return correct payment request URL for some details', async () => {
			// we'll use this demo URL from OnePay developer website for authenticity
			const checkoutPayload = {
				title: 'onepay paygate',
				amount: 10000,
				clientIp: '118.69.52.190',
				locale: 'vn',
				// billingCity: '',
				// billingCountry: '',
				// billingPostCode: '',
				// billingStateProvince: '',
				// billingStreet: '',
				currency: 'VND',
				// deliveryAddress: '',
				// deliveryCity: '',
				// deliveryCountry: '',
				// deliveryProvince: '',
				// customerEmail: null,
				// customerPhone: params.phoneNumber,
				orderId: 'TEST_15156659133131771069956',
				returnUrl: 'http://mtf.onepay.vn/developer/?page=demo_noidia',
				transactionId: 'TEST_15156659133131771069956',
				// customerId: params.email,
			};

			const redirectUrl = await onepayDom.buildCheckoutUrl(checkoutPayload);

			expect(redirectUrl.searchParams.get('vpc_SecureHash')).toEqual(
				'F42B6F097C919B567CDAC678586B6408B192611437AFF3A77ED9448C3E15AF37'
			);
		});

		it('should throw errors at missing required details', async () => {
			const checkoutPayload = {};
			await expect(onepayDom.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Amount is required');

			checkoutPayload.amount = 100;
			await expect(onepayDom.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Client ip is required');

			checkoutPayload.clientIp = '127.0.0.1';
			await expect(onepayDom.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Order ID is required');

			checkoutPayload.orderId = 'TEST123';
			await expect(onepayDom.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Return url is required');

			checkoutPayload.returnUrl = 'http://localhost:8080/payment/callback';
			await expect(onepayDom.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Transaction ID is required');

			checkoutPayload.transactionId = 'TEST123';
			await expect(onepayDom.buildCheckoutUrl(checkoutPayload)).resolves;
		});

		describe('validate wrong inputs', () => {
			let checkoutPayload;

			beforeEach(() => {
				checkoutPayload = {
					amount: 100,
					clientIp: '127.0.0.1',
					orderId: 'TEST123',
					returnUrl: 'http://localhost:8080/payment/callback',
					transactionId: 'TEST123',
				};
			});

			it('should throw errors at wrong amount input', async () => {
				checkoutPayload.amount = '100';

				await expect(onepayDom.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Amount must be of type Integer');

				checkoutPayload.amount = 123.45;
				await expect(onepayDom.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Amount must be an integer');

				checkoutPayload.amount = 99999999999; // more than max
				await expect(onepayDom.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Amount cannot exceed 9999999999');
			});

			it('should throw errors at wrong email input', async () => {
				checkoutPayload.customerEmail = '';

				await expect(onepayDom.buildCheckoutUrl(checkoutPayload)).rejects.toBe(
					'Customer email must be a valid email address'
				);

				checkoutPayload.customerEmail = 'invalid.email';

				await expect(onepayDom.buildCheckoutUrl(checkoutPayload)).rejects.toBe(
					'Customer email must be a valid email address'
				);

				checkoutPayload.customerEmail = 'valid@email.xyz';

				await expect(onepayDom.buildCheckoutUrl(checkoutPayload)).resolves;
			});

			it('should throw errors at wrong returnUrl input', async () => {
				checkoutPayload.returnUrl = '';
				await expect(onepayDom.buildCheckoutUrl(checkoutPayload)).rejects.toBe(
					'Return url failed regular expression validation'
				);

				checkoutPayload.returnUrl = '//localhost:8080';
				await expect(onepayDom.buildCheckoutUrl(checkoutPayload)).rejects.toBe(
					'Return url failed regular expression validation'
				);

				checkoutPayload.returnUrl = 'example.com/checkout';
				await expect(onepayDom.buildCheckoutUrl(checkoutPayload)).rejects.toBe(
					'Return url failed regular expression validation'
				);

				checkoutPayload.returnUrl = 'http://localhost:8080/';
				await expect(onepayDom.buildCheckoutUrl(checkoutPayload)).resolves;
			});
		});
	});

	describe('OnePayDomestic.verifyReturnUrl', () => {
		it('should verify the return URL', async () => {
			const correctReturnUrl = {
				vpc_AdditionData: '970436',
				vpc_Amount: '90000000',
				vpc_Command: 'pay',
				vpc_CurrencyCode: 'VND',
				vpc_Locale: 'vn',
				vpc_MerchTxnRef: 'node-2018-01-15T10:19:55.541Z',
				vpc_Merchant: 'ONEPAY',
				vpc_OrderInfo: 'node-2018-01-15T10:19:55.541Z',
				vpc_TransactionNo: '1617996',
				vpc_TxnResponseCode: '0',
				vpc_Version: '2',
				vpc_SecureHash: '8B720A26C295F225FCF57F9619562341914649C07F9C9FD359A514C2905D67C2',
			};

			await expect(onepayDom.verifyReturnUrl(correctReturnUrl)).resolves.toEqual({
				isSuccess: true,
				amount: 900000,
				command: 'pay',
				currencyCode: 'VND',
				locale: 'vn',
				merchant: 'ONEPAY',
				message: 'Giao dịch thành công',
				gatewayTransactionNo: '1617996',
				orderId: 'node-2018-01-15T10:19:55.541Z',
				responseCode: '0',
				secureHash: '8B720A26C295F225FCF57F9619562341914649C07F9C9FD359A514C2905D67C2',
				transactionId: 'node-2018-01-15T10:19:55.541Z',
				version: '2',
				vpc_AdditionData: '970436',
				vpc_Amount: '90000000',
				vpc_Command: 'pay',
				vpc_CurrencyCode: 'VND',
				vpc_Locale: 'vn',
				vpc_MerchTxnRef: 'node-2018-01-15T10:19:55.541Z',
				vpc_Merchant: 'ONEPAY',
				vpc_OrderInfo: 'node-2018-01-15T10:19:55.541Z',
				vpc_TransactionNo: '1617996',
				vpc_TxnResponseCode: '0',
				vpc_Version: '2',
				vpc_SecureHash: '8B720A26C295F225FCF57F9619562341914649C07F9C9FD359A514C2905D67C2',
			});

			const incorrectReturnUrl = Object.assign({}, correctReturnUrl, { vpc_Amount: '50000000' });
			const errorResults = await onepayDom.verifyReturnUrl(incorrectReturnUrl);

			expect(errorResults.isSuccess).toEqual(false);
			expect(errorResults.message).toEqual('Wrong checksum');
		});
	});
});

describe('OnePayInternational', () => {
	let onepayIntl;

	beforeEach(() => {
		onepayIntl = new OnePayInternational({
			paymentGateway: 'https://mtf.onepay.vn/vpcpay/vpcpay.op',
			merchant: 'TESTONEPAY',
			accessCode: '6BEB2546',
			secureSecret: '6D0870CDE5F24F34F3915FB0045120DB',
		});
	});

	describe('OnePayInternational static properties', () => {
		it('should inherit from OnePay', () => {
			expect(OnePayInternational.VERSION).toEqual('2');
			expect(OnePayInternational.COMMAND).toEqual('pay');
			expect(OnePayInternational.CURRENCY_VND).toEqual('VND');
			expect(OnePayInternational.LOCALE_EN).toEqual('en');
			expect(OnePayInternational.LOCALE_VN).toEqual('vn');
		});
	});

	describe('OnePayInternational.buildCheckoutUrl', () => {
		it('should return correct payment request URL all details', async () => {
			// we'll use this demo URL from OnePay developer website for authenticity
			// https://mtf.onepay.vn/vpcpay/vpcpay.op?AVS_City=Hanoi&AVS_Country=VN&AVS_PostCode=10000&AVS_StateProv=Hoan+Kiem&AVS_Street01=194+Tran+Quang+Khai&AgainLink=http%253A%252F%252Flocalhost%252F%257Ethanh%252Fquocte_php%252F&Title=VPC+3-Party&vpc_AccessCode=6BEB2546&vpc_Amount=1000000&vpc_Command=pay&vpc_Customer_Email=support%40onepay.vn&vpc_Customer_Id=thanhvt&vpc_Customer_Phone=840904280949&vpc_Locale=en&vpc_MerchTxnRef=2018011121565445977757&vpc_Merchant=TESTONEPAY&vpc_OrderInfo=JSECURETEST01&vpc_ReturnURL=http%3A%2F%2Flocalhost%2F%7Ethanh%2Fquocte_php%2Fdr.php&vpc_SHIP_City=Ha+Noi&vpc_SHIP_Country=Viet+Nam&vpc_SHIP_Provice=Hoan+Kiem&vpc_SHIP_Street01=39A+Ngo+Quyen&vpc_TicketNo=%3A%3A1&vpc_Version=2&vpc_SecureHash=6A1F6F957E74559083B97D38DF109E5E18292D8516785CA7E794FBB59717A654
			const checkoutPayload = {
				againLink: 'http://localhost/~thanh/quocte_php/',
				amount: 10000,
				clientIp: '::1',
				locale: 'en',
				// billingCity: '',
				billingCountry: 'VN',
				billingPostCode: '10000',
				billingStateProvince: 'Hoan Kiem',
				billingStreet: '194 Tran Quang Khai',
				currency: 'VND',
				deliveryAddress: '39A Ngo Quyen',
				deliveryCity: 'Ha Noi',
				deliveryCountry: 'Viet Nam',
				deliveryProvince: 'Hoan Kiem',
				customerEmail: 'support@onepay.vn',
				customerPhone: '840904280949',
				orderId: 'JSECURETEST01',
				returnUrl: 'http://localhost/~thanh/quocte_php/dr.php',
				transactionId: '2018011121565445977757',
				customerId: 'thanhvt',
			};

			const redirectUrl = await onepayIntl.buildCheckoutUrl(checkoutPayload);

			expect(redirectUrl.searchParams.get('vpc_SecureHash')).toEqual(
				'6A1F6F957E74559083B97D38DF109E5E18292D8516785CA7E794FBB59717A654'
			);
		});

		it('should return correct payment request URL for some details', async () => {
			// we'll use this demo URL from OnePay developer website for authenticity
			// https://mtf.onepay.vn/vpcpay/vpcpay.op?AgainLink=http%253A%252F%252Flocalhost%252F%257Ethanh%252Fquocte_php%252F&Title=VPC+3-Party&vpc_AccessCode=6BEB2546&vpc_Amount=1000000&vpc_Command=pay&vpc_Customer_Id=thanhvt&vpc_Locale=en&vpc_MerchTxnRef=2018-01-11T15%3A22%3A56.437Z&vpc_Merchant=TESTONEPAY&vpc_OrderInfo=2018-01-11T15%3A22%3A56.437Z&vpc_ReturnURL=http%3A%2F%2Flocalhost%2F%7Ethanh%2Fquocte_php%2Fdr.php&vpc_TicketNo=127.0.0.1&vpc_Version=2&vpc_SecureHash=CD5AE671AACD30ED1A754050A3C3C8951AD4CF99DBB168F66A856137C82C8EFC
			const checkoutPayload = {
				againLink: 'http://localhost/~thanh/quocte_php/',
				amount: 10000,
				clientIp: '127.0.0.1',
				locale: 'en',
				// billingCity: '',
				// billingCountry: '',
				// billingPostCode: '',
				// billingStateProvince: '',
				// billingStreet: '',
				currency: 'VND',
				// deliveryAddress: '',
				// deliveryCity: '',
				// deliveryCountry: '',
				// deliveryProvince: '',
				// customerEmail: null,
				// customerPhone: params.phoneNumber,
				orderId: '2018-01-11T15:22:56.437Z',
				returnUrl: 'http://localhost/~thanh/quocte_php/dr.php',
				transactionId: '2018-01-11T15:22:56.437Z',
				customerId: 'thanhvt',
			};

			const redirectUrl = await onepayIntl.buildCheckoutUrl(checkoutPayload);

			expect(redirectUrl.searchParams.get('vpc_SecureHash')).toEqual(
				'CD5AE671AACD30ED1A754050A3C3C8951AD4CF99DBB168F66A856137C82C8EFC'
			);
		});
	});

	it('should throw errors at missing required details', async () => {
		const checkoutPayload = {};

		await expect(onepayIntl.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Again link is required');

		checkoutPayload.againLink = 'http://localhost:8080';
		await expect(onepayIntl.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Amount is required');

		checkoutPayload.amount = 100;
		await expect(onepayIntl.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Client ip is required');

		checkoutPayload.clientIp = '127.0.0.1';
		await expect(onepayIntl.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Order ID is required');

		checkoutPayload.orderId = 'TEST123';
		await expect(onepayIntl.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Return url is required');

		checkoutPayload.returnUrl = 'http://localhost:8080/payment/callback';
		await expect(onepayIntl.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Transaction ID is required');

		checkoutPayload.transactionId = 'TEST123';
		await expect(onepayIntl.buildCheckoutUrl(checkoutPayload)).resolves;
	});

	describe('validate wrong inputs', () => {
		let checkoutPayload;

		beforeEach(() => {
			checkoutPayload = {
				againLink: 'http://localhost:8080',
				amount: 100,
				clientIp: '127.0.0.1',
				orderId: 'TEST123',
				returnUrl: 'http://localhost:8080/payment/callback',
				transactionId: 'TEST123',
			};
		});

		it('should throw errors at wrong amount input', async () => {
			checkoutPayload.amount = '100';

			await expect(onepayIntl.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Amount must be of type Integer');

			checkoutPayload.amount = 123.45;
			await expect(onepayIntl.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Amount must be an integer');

			checkoutPayload.amount = 99999999999; // more than max
			await expect(onepayIntl.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Amount cannot exceed 9999999999');
		});

		it('should throw errors at wrong email input', async () => {
			checkoutPayload.customerEmail = '';

			await expect(onepayIntl.buildCheckoutUrl(checkoutPayload)).rejects.toBe(
				'Customer email must be a valid email address'
			);

			checkoutPayload.customerEmail = 'invalid.email';

			await expect(onepayIntl.buildCheckoutUrl(checkoutPayload)).rejects.toBe(
				'Customer email must be a valid email address'
			);

			checkoutPayload.customerEmail = 'valid@email.xyz';

			await expect(onepayIntl.buildCheckoutUrl(checkoutPayload)).resolves;
		});

		it('should throw errors at wrong returnUrl input', async () => {
			checkoutPayload.returnUrl = '';
			await expect(onepayIntl.buildCheckoutUrl(checkoutPayload)).rejects.toBe(
				'Return url failed regular expression validation'
			);

			checkoutPayload.returnUrl = '//localhost:8080';
			await expect(onepayIntl.buildCheckoutUrl(checkoutPayload)).rejects.toBe(
				'Return url failed regular expression validation'
			);

			checkoutPayload.returnUrl = 'example.com/checkout';
			await expect(onepayIntl.buildCheckoutUrl(checkoutPayload)).rejects.toBe(
				'Return url failed regular expression validation'
			);

			checkoutPayload.returnUrl = 'http://localhost:8080/';
			await expect(onepayIntl.buildCheckoutUrl(checkoutPayload)).resolves;
		});
	});

	describe('OnePayIntl.verifyReturnUrl', () => {
		it('should verify the return URL', async () => {
			const correctReturnUrl = {
				vpc_OrderInfo: 'node-2018-01-16T09:44:54.120Z',
				vpc_3DSECI: '06',
				vpc_ReturnACI: '8',
				vpc_AVS_Street01: '441 Cach Mang Thang Tam',
				vpc_Merchant: 'TESTONEPAY',
				vpc_Card: 'VC',
				vpc_AcqCSCRespCode: 'Unsupported',
				vpc_AcqResponseCode: '00',
				AgainLink: 'http://localhost:8080/',
				vpc_AVS_Country: 'VNM',
				vpc_AuthorizeId: '523255',
				vpc_3DSenrolled: 'N',
				vpc_RiskOverallResult: 'ACC',
				vpc_ReceiptNo: '801620523255',
				vpc_AVSRequestCode: 'Z',
				vpc_TransactionNo: '62277',
				vpc_MarketSpecificData: '8',
				vpc_AVS_StateProv: 'Ho Chi Minh',
				vpc_Locale: 'en_VN',
				vpc_TxnResponseCode: '0',
				vpc_Amount: '90000000',
				vpc_BatchNo: '20180116',
				vpc_TransactionIdentifier: '1234567890123456789',
				vpc_CommercialCard: 'U',
				vpc_Version: '2',
				vpc_AVSResultCode: 'Unsupported',
				vpc_VerStatus: 'E',
				vpc_Command: 'pay',
				vpc_Message: 'Approved',
				Title: 'VPC 3-Party',
				vpc_CardLevelIndicator: '88',
				vpc_SecureHash: '20C0AB42A07408933D18FC9365791DA0F127E282B0FD5E4BE3D88E3DEE95D364',
				vpc_CardNum: '400555xxxxxx0001',
				vpc_AVS_PostCode: '700000',
				vpc_CSCResultCode: 'Unsupported',
				vpc_MerchTxnRef: 'node-2018-01-16T09:44:54.120Z',
				vpc_VerType: '3DS',
				vpc_AcqAVSRespCode: 'Unsupported',
				vpc_VerSecurityLevel: '06',
				vpc_3DSXID: 'jOtz0r1hlQNqrisCuJseRUCtV8Q=',
				vpc_AVS_City: '10',
				vpc_CommercialCardIndicator: '3',
			};

			await expect(onepayIntl.verifyReturnUrl(correctReturnUrl)).resolves.toEqual({
				isSuccess: true,
				amount: 900000,
				billingCity: '10',
				billingCountry: 'VNM',
				billingPostCode: '700000',
				billingStateProvince: 'Ho Chi Minh',
				billingStreet: '441 Cach Mang Thang Tam',
				card: 'VC',
				command: 'pay',
				currencyCode: 'VND', // no Currency Code return from OnePay, it is hardcoded
				gatewayTransactionNo: '62277',
				locale: 'en_VN',
				merchant: 'TESTONEPAY',
				message: 'Approved',
				orderId: 'node-2018-01-16T09:44:54.120Z',
				responseCode: '0',
				secureHash: '20C0AB42A07408933D18FC9365791DA0F127E282B0FD5E4BE3D88E3DEE95D364',
				transactionId: 'node-2018-01-16T09:44:54.120Z',
				version: '2',
				vpc_OrderInfo: 'node-2018-01-16T09:44:54.120Z',
				vpc_3DSECI: '06',
				vpc_ReturnACI: '8',
				vpc_AVS_Street01: '441 Cach Mang Thang Tam',
				vpc_Merchant: 'TESTONEPAY',
				vpc_Card: 'VC',
				vpc_AcqCSCRespCode: 'Unsupported',
				vpc_AcqResponseCode: '00',
				AgainLink: 'http://localhost:8080/',
				vpc_AVS_Country: 'VNM',
				vpc_AuthorizeId: '523255',
				vpc_3DSenrolled: 'N',
				vpc_RiskOverallResult: 'ACC',
				vpc_ReceiptNo: '801620523255',
				vpc_AVSRequestCode: 'Z',
				vpc_TransactionNo: '62277',
				vpc_MarketSpecificData: '8',
				vpc_AVS_StateProv: 'Ho Chi Minh',
				vpc_Locale: 'en_VN',
				vpc_TxnResponseCode: '0',
				vpc_Amount: '90000000',
				vpc_BatchNo: '20180116',
				vpc_TransactionIdentifier: '1234567890123456789',
				vpc_CommercialCard: 'U',
				vpc_Version: '2',
				vpc_AVSResultCode: 'Unsupported',
				vpc_VerStatus: 'E',
				vpc_Command: 'pay',
				vpc_Message: 'Approved',
				Title: 'VPC 3-Party',
				vpc_CardLevelIndicator: '88',
				vpc_SecureHash: '20C0AB42A07408933D18FC9365791DA0F127E282B0FD5E4BE3D88E3DEE95D364',
				vpc_CardNum: '400555xxxxxx0001',
				vpc_AVS_PostCode: '700000',
				vpc_CSCResultCode: 'Unsupported',
				vpc_MerchTxnRef: 'node-2018-01-16T09:44:54.120Z',
				vpc_VerType: '3DS',
				vpc_AcqAVSRespCode: 'Unsupported',
				vpc_VerSecurityLevel: '06',
				vpc_3DSXID: 'jOtz0r1hlQNqrisCuJseRUCtV8Q=',
				vpc_AVS_City: '10',
				vpc_CommercialCardIndicator: '3',
			});

			const incorrectReturnUrl = Object.assign({}, correctReturnUrl, { vpc_Amount: '50000000' });
			let errorResults = await onepayIntl.verifyReturnUrl(incorrectReturnUrl);

			expect(errorResults.isSuccess).toEqual(false);
			expect(errorResults.message).toEqual('Wrong checksum');

			const failAuthenticationReturnUrl = {
				vpc_Amount: '90000000',
				vpc_BatchNo: '0',
				vpc_Version: '2',
				vpc_OrderInfo: 'node-2018-01-16T10:04:25.165Z',
				vpc_VerStatus: 'N',
				vpc_Command: 'pay',
				vpc_Merchant: 'TESTONEPAY',
				vpc_Message: 'Transaction was blocked by the Payment Server because it did not pass all risk checks.',
				Title: 'VPC 3-Party',
				vpc_3DSstatus: 'N',
				AgainLink: 'http://localhost:8080/',
				vpc_SecureHash: '2F2D4CF9C23EEF1FEC01C9847E5C6FAF0263D13C329E96136A4C07B047E1E30E',
				vpc_3DSenrolled: 'Y',
				vpc_MerchTxnRef: 'node-2018-01-16T10:04:25.165Z',
				vpc_TransactionNo: '0',
				vpc_VerType: '3DS',
				vpc_VerSecurityLevel: '07',
				vpc_Locale: 'vn',
				vpc_3DSXID: '6cluGg6ggbL/8H7BVcLA4FcZ4tA=',
				vpc_TxnResponseCode: 'F',
			};

			errorResults = await onepayIntl.verifyReturnUrl(failAuthenticationReturnUrl);

			expect(errorResults.isSuccess).toEqual(false);
			expect(errorResults.message).toEqual(
				'Transaction was blocked by the Payment Server because it did not pass all risk checks.'
			);
			expect(OnePayInternational.getReturnUrlStatus(failAuthenticationReturnUrl.vpc_TxnResponseCode)).toEqual(
				'Giao dịch thất bại. Không xác thực được 3D'
			);
			expect(OnePayInternational.getReturnUrlStatus(failAuthenticationReturnUrl.vpc_TxnResponseCode, 'en')).toEqual(
				'3D Secure Authentication Failed'
			);
			expect(errorResults.responseCode).toEqual('F');
		});
	});
});
