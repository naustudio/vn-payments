import { OnePayDomestic, OnePayInternational } from '../src/onepay';

describe('OnePay Domestic', () => {
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
			expect(OnePayDomestic.VPC_VERSION).toEqual('2');
			expect(OnePayDomestic.VPC_COMMAND).toEqual('pay');
			expect(OnePayDomestic.CURRENCY_VND).toEqual('VND');
			expect(OnePayDomestic.LOCALE_EN).toEqual('en');
			expect(OnePayDomestic.LOCALE_VN).toEqual('vn');
		});
	});

	describe('OnePay.buildCheckoutUrl', () => {
		it('should return correct payment request URL all details', () => {
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

			const redirectUrl = onepayDom.buildCheckoutUrl(checkoutPayload);

			expect(redirectUrl.searchParams.get('vpc_SecureHash')).toEqual(
				'DDC85640D5B2D72AC46A16FBCD3E0DF7B4E05DB1818E2A0A423C2A31FAFF39E4'
			);
		});

		it('should return correct payment request URL for some details', () => {
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

			const redirectUrl = onepayDom.buildCheckoutUrl(checkoutPayload);

			expect(redirectUrl.searchParams.get('vpc_SecureHash')).toEqual(
				'F42B6F097C919B567CDAC678586B6408B192611437AFF3A77ED9448C3E15AF37'
			);
		});

		it('should throw errors at missing required details', () => {
			const checkoutPayload = {};
			expect(() => {
				onepayDom.buildCheckoutUrl(checkoutPayload);
			}).toThrow('Amount is required');

			checkoutPayload.amount = 100;
			expect(() => {
				onepayDom.buildCheckoutUrl(checkoutPayload);
			}).toThrow('Client ip is required');

			checkoutPayload.clientIp = '127.0.0.1';
			expect(() => {
				onepayDom.buildCheckoutUrl(checkoutPayload);
			}).toThrow('Order ID is required');

			checkoutPayload.orderId = 'TEST123';
			expect(() => {
				onepayDom.buildCheckoutUrl(checkoutPayload);
			}).toThrow('Return url is required');

			checkoutPayload.returnUrl = 'http://localhost:8080/payment/callback';
			expect(() => {
				onepayDom.buildCheckoutUrl(checkoutPayload);
			}).toThrow('Transaction ID is required');

			checkoutPayload.transactionId = 'TEST123';
			expect(() => {
				onepayDom.buildCheckoutUrl(checkoutPayload);
			}).not.toThrow();
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

			it('should throw errors at wrong amount input', () => {
				checkoutPayload.amount = '100';

				expect(() => {
					onepayDom.buildCheckoutUrl(checkoutPayload);
				}).toThrow('Amount must be of type Integer');

				checkoutPayload.amount = 123.45;
				expect(() => {
					onepayDom.buildCheckoutUrl(checkoutPayload);
				}).toThrow('Amount must be an integer');

				checkoutPayload.amount = 99999999999; // more than max
				expect(() => {
					onepayDom.buildCheckoutUrl(checkoutPayload);
				}).toThrow('Amount cannot exceed 9999999999');
			});

			it('should throw errors at wrong email input', () => {
				checkoutPayload.customerEmail = '';

				expect(() => {
					onepayDom.buildCheckoutUrl(checkoutPayload);
				}).toThrow('Customer email must be a valid email address');

				checkoutPayload.customerEmail = 'invalid.email';

				expect(() => {
					onepayDom.buildCheckoutUrl(checkoutPayload);
				}).toThrow('Customer email must be a valid email address');

				checkoutPayload.customerEmail = 'valid@email.xyz';

				expect(() => {
					onepayDom.buildCheckoutUrl(checkoutPayload);
				}).not.toThrow();
			});

			it('should throw errors at wrong returnUrl input', () => {
				checkoutPayload.returnUrl = '';
				expect(() => {
					onepayDom.buildCheckoutUrl(checkoutPayload);
				}).toThrow('Return url failed regular expression validation');

				checkoutPayload.returnUrl = '//localhost:8080';
				expect(() => {
					onepayDom.buildCheckoutUrl(checkoutPayload);
				}).toThrow('Return url failed regular expression validation');

				checkoutPayload.returnUrl = 'example.com/checkout';
				expect(() => {
					onepayDom.buildCheckoutUrl(checkoutPayload);
				}).toThrow('Return url failed regular expression validation');

				checkoutPayload.returnUrl = 'http://localhost:8080/';
				expect(() => {
					onepayDom.buildCheckoutUrl(checkoutPayload);
				}).not.toThrow();
			});
		});
	});

	describe('OnePayDom.verifyReturnUrl', () => {
		it('should verify the return URL', () => {
			console.log('TODO: OnePayDom.verifyReturnUrl');
		});
	});
});

describe('OnePay International', () => {
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
			expect(OnePayInternational.VPC_VERSION).toEqual('2');
			expect(OnePayInternational.VPC_COMMAND).toEqual('pay');
			expect(OnePayInternational.CURRENCY_VND).toEqual('VND');
			expect(OnePayInternational.LOCALE_EN).toEqual('en');
			expect(OnePayInternational.LOCALE_VN).toEqual('vn');
		});
	});

	describe('OnePay.buildCheckoutUrl', () => {
		it('should return correct payment request URL all details', () => {
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

			const redirectUrl = onepayIntl.buildCheckoutUrl(checkoutPayload);

			expect(redirectUrl.searchParams.get('vpc_SecureHash')).toEqual(
				'6A1F6F957E74559083B97D38DF109E5E18292D8516785CA7E794FBB59717A654'
			);
		});

		it('should return correct payment request URL for some details', () => {
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

			const redirectUrl = onepayIntl.buildCheckoutUrl(checkoutPayload);

			expect(redirectUrl.searchParams.get('vpc_SecureHash')).toEqual(
				'CD5AE671AACD30ED1A754050A3C3C8951AD4CF99DBB168F66A856137C82C8EFC'
			);
		});
	});

	it('should throw errors at missing required details', () => {
		const checkoutPayload = {};

		expect(() => {
			onepayIntl.buildCheckoutUrl(checkoutPayload);
		}).toThrow('Again link is required');

		checkoutPayload.againLink = 'http://localhost:8080';
		expect(() => {
			onepayIntl.buildCheckoutUrl(checkoutPayload);
		}).toThrow('Amount is required');

		checkoutPayload.amount = 100;
		expect(() => {
			onepayIntl.buildCheckoutUrl(checkoutPayload);
		}).toThrow('Client ip is required');

		checkoutPayload.clientIp = '127.0.0.1';
		expect(() => {
			onepayIntl.buildCheckoutUrl(checkoutPayload);
		}).toThrow('Order ID is required');

		checkoutPayload.orderId = 'TEST123';
		expect(() => {
			onepayIntl.buildCheckoutUrl(checkoutPayload);
		}).toThrow('Return url is required');

		checkoutPayload.returnUrl = 'http://localhost:8080/payment/callback';
		expect(() => {
			onepayIntl.buildCheckoutUrl(checkoutPayload);
		}).toThrow('Transaction ID is required');

		checkoutPayload.transactionId = 'TEST123';
		expect(() => {
			onepayIntl.buildCheckoutUrl(checkoutPayload);
		}).not.toThrow();
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

		it('should throw errors at wrong amount input', () => {
			checkoutPayload.amount = '100';

			expect(() => {
				onepayIntl.buildCheckoutUrl(checkoutPayload);
			}).toThrow('Amount must be of type Integer');

			checkoutPayload.amount = 123.45;
			expect(() => {
				onepayIntl.buildCheckoutUrl(checkoutPayload);
			}).toThrow('Amount must be an integer');

			checkoutPayload.amount = 99999999999; // more than max
			expect(() => {
				onepayIntl.buildCheckoutUrl(checkoutPayload);
			}).toThrow('Amount cannot exceed 9999999999');
		});

		it('should throw errors at wrong email input', () => {
			checkoutPayload.customerEmail = '';

			expect(() => {
				onepayIntl.buildCheckoutUrl(checkoutPayload);
			}).toThrow('Customer email must be a valid email address');

			checkoutPayload.customerEmail = 'invalid.email';

			expect(() => {
				onepayIntl.buildCheckoutUrl(checkoutPayload);
			}).toThrow('Customer email must be a valid email address');

			checkoutPayload.customerEmail = 'valid@email.xyz';

			expect(() => {
				onepayIntl.buildCheckoutUrl(checkoutPayload);
			}).not.toThrow();
		});

		it('should throw errors at wrong returnUrl input', () => {
			checkoutPayload.returnUrl = '';
			expect(() => {
				onepayIntl.buildCheckoutUrl(checkoutPayload);
			}).toThrow('Return url failed regular expression validation');

			checkoutPayload.returnUrl = '//localhost:8080';
			expect(() => {
				onepayIntl.buildCheckoutUrl(checkoutPayload);
			}).toThrow('Return url failed regular expression validation');

			checkoutPayload.returnUrl = 'example.com/checkout';
			expect(() => {
				onepayIntl.buildCheckoutUrl(checkoutPayload);
			}).toThrow('Return url failed regular expression validation');

			checkoutPayload.returnUrl = 'http://localhost:8080/';
			expect(() => {
				onepayIntl.buildCheckoutUrl(checkoutPayload);
			}).not.toThrow();
		});
	});

	describe('OnePayIntl.verifyReturnUrl', () => {
		it('should verify the return URL', () => {
			console.log('TODO: OnePayIntl.verifyReturnUrl');
		});
	});
});
