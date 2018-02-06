import { SohaPay } from '../src/sohapay';

const TEST_CONFIG = SohaPay.TEST_CONFIG;

describe('SohaPay', () => {
	let sohaPay;

	beforeEach(() => {
		sohaPay = new SohaPay({
			merchantCode: TEST_CONFIG.merchantCode,
			paymentGateway: TEST_CONFIG.paymentGateway,
			secureSecret: TEST_CONFIG.secureSecret,
		});
	});

	describe('SohaPay.buildCheckoutUrl', () => {
		it('should return correct payment request URL for some details', async () => {
			const checkoutPayload = {
				amount: 90000,
				customerEmail: 'tu.nguyen@naustud.io',
				customerPhone: '0999999999',
				orderId: 'node-2018-01-18T10:31:54.303Z',
				transactionId: 'node-2018-01-18T10:31:54.303Z',
				customerId: 'tu.nguyen@naustud.io',
				returnUrl: 'http://localhost:8080/payment/sohapay/callback',
				transactionInfo: 'Thanh toan giay adidas',
			};

			const redirectUrl = await sohaPay.buildCheckoutUrl(checkoutPayload);

			expect(redirectUrl.searchParams.get('secure_hash')).toEqual(
				'2987BA867AC489B41BD885AE6930C21F4DC010B4345CB6565F3356591FC5EBB9'
			);
		});

		it('should throw errors at missing required details', async () => {
			const checkoutPayload = {};
			await expect(sohaPay.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Order ID is required');

			checkoutPayload.orderId = 'node-2018-01-18T10:31:54.303Z';
			await expect(sohaPay.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Customer email is required');

			checkoutPayload.customerEmail = 'tu.nguyen@naustud.io';
			await expect(sohaPay.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Customer phone is required');

			checkoutPayload.customerPhone = '0999999999';
			await expect(sohaPay.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Return url is required');

			checkoutPayload.returnUrl = 'http://localhost:8080/payment/sohapay/callback';
			await expect(sohaPay.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Amount is required');

			checkoutPayload.amount = 90000;
			await expect(sohaPay.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Transaction info is required');

			checkoutPayload.transactionInfo = 'Thanh toan giay adidas';
			await expect(sohaPay.buildCheckoutUrl(checkoutPayload)).resolves;
		});

		describe('validate wrong inputs', () => {
			let checkoutPayload;

			beforeEach(() => {
				checkoutPayload = {
					amount: 90000,
					customerEmail: 'tu.nguyen@naustud.io',
					customerPhone: '0999999999',
					orderId: 'node-2018-01-18T10:31:54.303Z',
					transactionId: 'node-2018-01-18T10:31:54.303Z',
					customerId: 'tu.nguyen@naustud.io',
					returnUrl: 'http://localhost:8080/payment/sohapay/callback',
					transactionInfo: 'Thanh toan giay adidas',
				};
			});

			it('should throw errors at wrong amount input', async () => {
				checkoutPayload.amount = '90000';

				await expect(sohaPay.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Amount must be of type Integer');

				checkoutPayload.amount = 123.45;
				await expect(sohaPay.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Amount must be an integer');

				checkoutPayload.amount = 99999999999; // more than max
				await expect(sohaPay.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Amount cannot exceed 9999999999');
			});

			it('should throw errors at wrong email input', async () => {
				checkoutPayload.customerEmail = '';

				await expect(sohaPay.buildCheckoutUrl(checkoutPayload)).rejects.toBe(
					'Customer email must be a valid email address'
				);

				checkoutPayload.customerEmail = 'invalid.email';

				await expect(sohaPay.buildCheckoutUrl(checkoutPayload)).rejects.toBe(
					'Customer email must be a valid email address'
				);

				checkoutPayload.customerEmail = 'valid@email.xyz';

				await expect(sohaPay.buildCheckoutUrl(checkoutPayload)).resolves;
			});
		});
	});

	describe('SohaPay.verifyReturnUrl', () => {
		it('should verify the return URL', async () => {
			let errorResults = {};
			//TODO Success state for sohaPay

			const correctReturnUrl = {
				error_text: '',
				order_code: 'node-2018-01-18T162833.777Z',
				order_email: 'tu.nguyen@naustud.io',
				order_session: '0d592799a73979ce68e5beacd3fb3dc0',
				price: '90000',
				site_code: 'test',
				transaction_info: 'Thanh toan giay adidas',
				secure_code: '2A27D69C9AC5E219B202E189CCFBB14BDE71A48484FBE9AAA1E2D735032626AB',
			};

			errorResults = await sohaPay.verifyReturnUrl(correctReturnUrl);

			expect(errorResults.isSuccess).toEqual(false);
			expect(errorResults.message).toEqual('Wrong checksum');

			const userCancelReturnUrl = {
				error_text: 'Giao dịch thanh toán bị huỷ bỏ',
				order_code: 'node-2018-01-18T162833.777Z',
				order_email: 'tu.nguyen@naustud.io',
				order_session: '0d592799a73979ce68e5beacd3fb3dc0',
				price: '90000',
				site_code: 'test',
				transaction_info: 'Thanh toan giay adidas',
				secure_code: '2A27D69C9AC5E219B202E189CCFBB14BDE71A48484FBE9AAA1E2D735032626AB',
			};

			errorResults = await sohaPay.verifyReturnUrl(userCancelReturnUrl);

			expect(errorResults.isSuccess).toEqual(false);
			expect(errorResults.message).toEqual('Giao dịch thanh toán bị huỷ bỏ');

			const successReturnUrl = {
				response_message: 'Thanh toán thành công',
				order_code: 'node-2018-01-18T162833.777Z',
				order_email: 'tu.nguyen@naustud.io',
				order_session: '0d592799a73979ce68e5beacd3fb3dc0',
				price: '90000',
				site_code: 'test',
				transaction_info: 'Thanh toan giay adidas',
				response_code: '0',
				secure_code: 'F7CC9597BF341527DFDE0BBC04660C59BC57C0E4D19B23ACFEF3A0F3F466E6F3',
			};

			errorResults = await sohaPay.verifyReturnUrl(successReturnUrl);

			expect(errorResults.isSuccess).toEqual(true);
			expect(errorResults.message).toEqual('Thanh toán thành công');
		});
	});
});
