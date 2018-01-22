import { NganLuong, TEST_CONFIG } from '../src/nganluong';

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
			// https://sandbox.nganluong.vn:8088/nl30/checkout.api.nganluong.post.php?merchant_id=45571&merchant_password=2b9467c171707b3766fb41f50eee8013&version=3.1&function=SetExpressCheckout&receiver_email=tung.tran@naustud.io&order_code=node-2018-01-22T05:05:17.266Z&total_amount=90000&payment_method=ATM_ONLINE&bank_code=BAB&order_description=Thanh%20toan%20giay%20adidas&return_url=http://localhost:8080/payment/nganluong/callback&cancel_url=http://localhost:8080/&buyer_fullname=T%C3%BA%20%C4%90%E1%BB%8Bch&buyer_email=tu.nguyen@naustud.io&buyer_mobile=0999999999&buyer_address=441%20C%C3%A1ch%20M%E1%BA%A1ng%20Th%C3%A1ng%20T%C3%A1m&cur_code=vnd&lang_code=vi
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
				/https:\/\/sandbox.nganluong.vn:8088\/nl30\/checkout\/version31\/index\/token_code\/.*/
			);
		});

		it('should throw errors at missing required details', async () => {
			const checkoutPayload = {};
			await expect(nganluong.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Amount is required');

			checkoutPayload.amount = 90000;
			await expect(nganluong.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Order ID is required');

			checkoutPayload.orderId = 'TEST123';
			await expect(nganluong.buildCheckoutUrl(checkoutPayload)).rejects.toBe('Payment method is required');

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

	// describe('NganLuongDom.verifyReturnUrl', () => {
	// 	it('should verify the return URL', async () => {
	// 		const correctReturnUrl = {
	// 			vnp_Amount: '90000000',
	// 			vnp_BankCode: 'NCB',
	// 			vnp_BankTranNo: '20180115170515',
	// 			vnp_CardType: 'ATM',
	// 			vnp_OrderInfo: 'Thanh toan giay adidas',
	// 			vnp_PayDate: '20180115170716',
	// 			vnp_ResponseCode: '00',
	// 			vnp_TmnCode: 'COCOSIN',
	// 			vnp_TransactionNo: '13008888',
	// 			vnp_TxnRef: 'node-2018-01-15T10:04:36.540Z',
	// 			vnp_SecureHashType: 'MD5',
	// 			vnp_SecureHash: '115ad37de7ae4d28eb819ca3d3d85b20',
	// 		};

	// 		await expect(nganluong.verifyReturnUrl(correctReturnUrl)).resolves.toEqual({
	// 			merchant: 'COCOSIN',
	// 			transactionId: 'node-2018-01-15T10:04:36.540Z',
	// 			amount: 900000,
	// 			orderInfo: 'Thanh toan giay adidas',
	// 			responseCode: '00',
	// 			bankCode: 'NCB',
	// 			bankTranNo: '20180115170515',
	// 			cardType: 'ATM',
	// 			payDate: '20180115170716',
	// 			gatewayTransactionNo: '13008888',
	// 			secureHash: '115ad37de7ae4d28eb819ca3d3d85b20',
	// 			message: 'Giao dịch thành công',
	// 			isSuccess: true,
	// 			vnp_Amount: '90000000',
	// 			vnp_BankCode: 'NCB',
	// 			vnp_BankTranNo: '20180115170515',
	// 			vnp_CardType: 'ATM',
	// 			vnp_OrderInfo: 'Thanh toan giay adidas',
	// 			vnp_PayDate: '20180115170716',
	// 			vnp_ResponseCode: '00',
	// 			vnp_TmnCode: 'COCOSIN',
	// 			vnp_TransactionNo: '13008888',
	// 			vnp_TxnRef: 'node-2018-01-15T10:04:36.540Z',
	// 			vnp_SecureHashType: 'MD5',
	// 			vnp_SecureHash: '115ad37de7ae4d28eb819ca3d3d85b20',
	// 		});

	// 		const incorrectReturnUrl = Object.assign({}, correctReturnUrl, { vnp_Amount: '50000000' });
	// 		let errorResults = await nganluong.verifyReturnUrl(incorrectReturnUrl);

	// 		expect(errorResults.isSuccess).toEqual(false);
	// 		expect(errorResults.message).toEqual('Wrong checksum');

	// 		const userCancelReturnUrl = {
	// 			vnp_Amount: '90000000',
	// 			vnp_BankCode: 'VNPAY',
	// 			vnp_CardType: 'ATM',
	// 			vnp_OrderInfo: 'Thanh toan giay adidas',
	// 			vnp_PayDate: '20180115172917',
	// 			vnp_ResponseCode: '24',
	// 			vnp_TmnCode: 'COCOSIN',
	// 			vnp_TransactionNo: '0',
	// 			vnp_TxnRef: 'node-2018-01-15T10:29:07.696Z',
	// 			vnp_SecureHashType: 'MD5',
	// 			vnp_SecureHash: '305d85b6eb840c29cd5707932ab0ac8b',
	// 		};

	// 		errorResults = await nganluong.verifyReturnUrl(userCancelReturnUrl);

	// 		expect(errorResults.isSuccess).toEqual(false);
	// 		expect(errorResults.message).toEqual('Giao dịch không thành công do: Khách hàng hủy giao dịch');
	// 	});
	// });
});
