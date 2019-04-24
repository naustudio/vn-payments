import { NganLuong } from '../src/nganluong';

const TEST_CONFIG = NganLuong.TEST_CONFIG;

describe('NganLuong', () => {
	let nganluong;

	beforeEach(() => {
		nganluong = new NganLuong({
			paymentGateway: TEST_CONFIG.paymentGateway,
			merchant: TEST_CONFIG.merchant,
			receiverEmail: TEST_CONFIG.receiverEmail,
			secureSecret: TEST_CONFIG.secureSecret,
		});
	});

	describe('NganLuong.buildCheckoutUrl', () => {
		it('should return correct payment request URL for some details', async () => {
			// we'll use this demo URL from NganLuong developer website for authenticity
			// https://sandbox.nganluong.vn:8088/nl35/checkout.api.nganluong.post.php?merchant_id=45571&merchant_password=2b9467c171707b3766fb41f50eee8013&version=3.1&function=SetExpressCheckout&receiver_email=tung.tran@naustud.io&order_code=node-2018-01-22T05:05:17.266Z&total_amount=90000&payment_method=ATM_ONLINE&bank_code=BAB&order_description=Thanh%20toan%20giay%20adidas&return_url=http://localhost:8080/payment/nganluong/callback&cancel_url=http://localhost:8080/&buyer_fullname=T%C3%BA%20%C4%90%E1%BB%8Bch&buyer_email=tu.nguyen@naustud.io&buyer_mobile=0999999999&buyer_address=441%20C%C3%A1ch%20M%E1%BA%A1ng%20Th%C3%A1ng%20T%C3%A1m&cur_code=vnd&lang_code=vi
			const checkoutPayload = {
				orderId: 'node-2018-01-22T05:05:17.266Z',
				transactionId: 'node-2018-01-22T05:05:17.266Z',
				amount: 90000,
				bankCode: 'BAB',
				paymentMethod: 'ATM_ONLINE',
				orderInfo: 'Thanh toan giay adidas',
				locale: 'vi',
				currency: 'VND',
				returnUrl: 'http://localhost:8080/payment/nganluong/callback',
				cancelUrl: 'http://localhost:8080/',
				customerId: 'thanhvt',
				clientIp: '127.0.0.1',
				customerName: 'Tú Địch',
				customerEmail: 'tu.nguyen@naustud.io',
				customerPhone: '0999999999',
			};

			const redirectUrl = await nganluong.buildCheckoutUrl(checkoutPayload);

			expect(redirectUrl.href).toMatch(
				/https:\/\/sandbox.nganluong.vn:8088\/nl35\/checkout\/version31\/index\/token_code\/.*/
			);
		});

		it('should throw errors at missing required details', async () => {
			const checkoutPayload = {};
			await expect(nganluong.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Amount is required');

			checkoutPayload.amount = 90000;
			await expect(nganluong.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Order ID is required');

			checkoutPayload.orderId = 'TEST123';
			await expect(nganluong.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Payment method is required');

			checkoutPayload.paymentMethod = 'VISA';
			await expect(nganluong.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Customer email is required');

			checkoutPayload.paymentMethod = 'ATM_ONLINE';
			await expect(nganluong.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Bank code is required');

			checkoutPayload.bankCode = 'BAB';
			await expect(nganluong.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Customer email is required');

			checkoutPayload.customerEmail = 'tu.nguyen@naustud.io';
			await expect(nganluong.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Customer phone is required');

			checkoutPayload.customerPhone = '099999999';
			await expect(nganluong.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Customer name is required');

			checkoutPayload.customerName = 'Tu Dich';
			await expect(nganluong.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Return url is required');

			checkoutPayload.returnUrl = 'http://localhost:8080/payment/callback';
			await expect(nganluong.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Transaction ID is required');

			checkoutPayload.transactionId = 'TEST123';
			await expect(nganluong.buildCheckoutUrl(checkoutPayload)).resolves;
		});

		describe('validate wrong inputs', () => {
			let checkoutPayload;

			beforeEach(() => {
				checkoutPayload = {
					amount: 90000,
					clientIp: '127.0.0.1',
					orderId: 'TEST123',
					paymentMethod: 'ATM_ONLINE',
					bankCode: 'BAB',
					customerEmail: 'tu.nguyen@naustud.io',
					customerPhone: '099999999',
					customerName: 'Tu Dich',
					returnUrl: 'http://localhost:8080/payment/nganluong/callback',
					transactionId: 'TEST123',
				};
			});

			it('should throw errors at wrong amount input', async () => {
				checkoutPayload.amount = '100';

				await expect(nganluong.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Amount must be of type Integer');

				checkoutPayload.amount = 123.45;
				await expect(nganluong.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Amount must be an integer');
			});

			it('should throw errors at wrong email input', async () => {
				checkoutPayload.customerEmail = '';

				await expect(nganluong.buildCheckoutUrl(checkoutPayload)).rejects.toBe(
					'Customer email must be a valid email address'
				);

				checkoutPayload.customerEmail = 'invalid.email';

				await expect(nganluong.buildCheckoutUrl(checkoutPayload)).rejects.toBe(
					'Customer email must be a valid email address'
				);

				checkoutPayload.customerEmail = 'valid@email.xyz';

				await expect(nganluong.buildCheckoutUrl(checkoutPayload)).resolves;
			});
		});
	});

	describe('NganLuongDom.verifyReturnUrl', () => {
		it('should verify the return URL', async () => {
			const correctReturnUrl = {
				error_code: '00',
				token: '43622-60372d15292ee552c8a17d773990f9c1',
			};

			await expect(nganluong.verifyReturnUrl(correctReturnUrl)).resolves.toEqual({
				isSuccess: true,
				error_code: '00',
				token: '43622-60372d15292ee552c8a17d773990f9c1',
				description: '',
				transaction_status: '00',
				receiver_email: 'tung.tran@naustud.io',
				order_code: 'node-2018-01-22T09:30:58.856Z',
				total_amount: '90000',
				payment_method: 'ATM_ONLINE',
				bank_code: 'BAB',
				payment_type: '2',
				order_description: 'Thanh toan giay adidas',
				tax_amount: '0',
				discount_amount: '0',
				fee_shipping: '0',
				return_url: 'http%3A%2F%2Flocalhost%3A8080%2Fpayment%2Fnganluong%2Fcallback',
				cancel_url: 'http%3A%2F%2Flocalhost%3A8080%2F',
				buyer_fullname: 'Tú Địch',
				buyer_email: 'tu.nguyen@naustud.io',
				buyer_mobile: '0999999999',
				buyer_address: '441 Cách Mạng Tháng Tám',
				affiliate_code: '',
				transaction_id: '19563755',
				merchant: '4',
				transactionId: 'node-2018-01-22T09:30:58.856Z',
				amount: '90000',
				orderInfo: 'Thanh toan giay adidas',
				responseCode: '00',
				bankCode: 'BAB',
				gatewayTransactionNo: '19563755',
				message: 'Giao dịch thành công',
				customerEmail: 'tu.nguyen@naustud.io',
				customerPhone: '0999999999',
				customerName: 'Tú Địch',
			});

			const incorrectReturnUrl = Object.assign({}, correctReturnUrl, { token: 'wrongtoken' });
			let errorResults = await nganluong.verifyReturnUrl(incorrectReturnUrl);

			expect(errorResults.isSuccess).toEqual(false);

			const noTokenReturnUrl = Object.assign({}, correctReturnUrl, { token: '' });
			errorResults = await nganluong.verifyReturnUrl(noTokenReturnUrl);

			expect(errorResults.isSuccess).toEqual(false);

			nganluong = new NganLuong({
				paymentGateway: TEST_CONFIG.paymentGateway,
				merchant: `${TEST_CONFIG.merchant}test`,
				receiverEmail: TEST_CONFIG.receiverEmail,
				secureSecret: TEST_CONFIG.secureSecret,
			});

			errorResults = await nganluong.verifyReturnUrl(correctReturnUrl);

			expect(errorResults.isSuccess).toEqual(true);
		});
	});
});
