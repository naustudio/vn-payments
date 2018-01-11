import { OnePay } from '../src/onepay';

describe('OnePay Domestic', () => {
	let onepayDom;

	beforeEach(() => {
		onepayDom = new OnePay({
			paymentGateway: 'https://mtf.onepay.vn/onecomm-pay/vpc.op',
			merchant: 'ONEPAY',
			accessCode: 'D67342C2',
			secureSecret: 'A3EFDFABA8653DF2342E8DAC29B51AF0',
		});
	});

	describe('OnePay.buildCheckoutUrl', () => {
		it('should return correct payment request URL 20,000VND', () => {
			// we'll use this demo URL from OnePay developer website for authenticity
			// https://mtf.onepay.vn/onecomm-pay/vpc.op?vpc_Amount=2000000&&vpc_Version=2&vpc_OrderInfo=TEST_15156649117651303838150&vpc_Command=pay&vpc_Currency=VND&&vpc_Merchant=ONEPAY&Title=onepay+paygate&&&vpc_ReturnURL=http%3A%2F%2Fmtf.onepay.vn%2Fdeveloper%2F%3Fpage%3Ddemo_noidia&&vpc_SecureHash=88F9D6B5EE0BA2304C407EF44AF9995E9091C07DE71BF4F10368290D54C66C4D&vpc_AccessCode=D67342C2&vpc_MerchTxnRef=TEST_15156649117651303838150&&vpc_TicketNo=118.69.52.190&&vpc_Locale=vn
			const checkoutPayload = {
				title: 'onepay paygate',
				amount: 20000,
				clientIp: '118.69.52.190',
				locale: 'vn',
				// againLink: '/',
				// billingCity: '',
				// billingCountry: '',
				// billingPostCode: '',
				// billingStateProvince: '',
				// billingStreet: '',
				currency: 'VND',
				// deliveryAddress: '',
				// deliveryCity: '',
				// deliveryCountry: '',
				// customerEmail: null,
				// customerPhone: params.phoneNumber,
				// deliveryProvince: '',
				orderId: 'TEST_15156649117651303838150',
				returnUrl: 'http://mtf.onepay.vn/developer/?page=demo_noidia',
				transactionId: 'TEST_15156649117651303838150',
				// customerId: params.email,
			};

			const redirectUrl = onepayDom.buildCheckoutUrl(checkoutPayload);

			expect(redirectUrl.searchParams.get('vpc_SecureHash')).toEqual(
				'88F9D6B5EE0BA2304C407EF44AF9995E9091C07DE71BF4F10368290D54C66C4D'
			);
		});

		it('should return correct payment request URL 10,000VND', () => {
			// we'll use this demo URL from OnePay developer website for authenticity
			// https://mtf.onepay.vn/onecomm-pay/vpc.op?vpc_Amount=1000000&&vpc_Version=2&vpc_OrderInfo=TEST_15156659133131771069956&vpc_Command=pay&vpc_Currency=VND&&vpc_Merchant=ONEPAY&Title=onepay+paygate&&&vpc_ReturnURL=http%3A%2F%2Fmtf.onepay.vn%2Fdeveloper%2F%3Fpage%3Ddemo_noidia&&vpc_SecureHash=F42B6F097C919B567CDAC678586B6408B192611437AFF3A77ED9448C3E15AF37&vpc_AccessCode=D67342C2&vpc_MerchTxnRef=TEST_15156659133131771069956&&vpc_TicketNo=118.69.52.190&&vpc_Locale=vn
			const checkoutPayload = {
				title: 'onepay paygate',
				amount: 10000,
				clientIp: '118.69.52.190',
				locale: 'vn',
				// againLink: '/',
				// billingCity: '',
				// billingCountry: '',
				// billingPostCode: '',
				// billingStateProvince: '',
				// billingStreet: '',
				currency: 'VND',
				// deliveryAddress: '',
				// deliveryCity: '',
				// deliveryCountry: '',
				// customerEmail: null,
				// customerPhone: params.phoneNumber,
				// deliveryProvince: '',
				orderId: 'TEST_15156659133131771069956',
				returnUrl: 'http://mtf.onepay.vn/developer/?page=demo_noidia',
				transactionId: 'TEST_15156659133131771069956',
				// customerId: params.email,
			};

			const redirectUrl = onepayDom.buildCheckoutUrl(checkoutPayload);

			expect(redirectUrl.searchParams.get('vpc_SecureHash')).toEqual(
				'F42B6F097C919B567CDAC678586B6408B192611437AFF3A77ED9448C3E15AF37'
			);
		});
	});
});
