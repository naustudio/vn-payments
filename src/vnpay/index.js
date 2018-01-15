/* © 2017 NauStud.io
 * @author Eric Tran
 */

/*eslint-disable no-shadow, key-spacing, no-param-reassign*/
import SimpleSchema from 'simpl-schema';

export { VNPay } from './VNPay';

/* eslint-disable no-unused-vars */
// for reference, not used for now
const vnpayDomReturnSchema = new SimpleSchema(
	{
		vnp_TmnCode: String,
		vnp_TxnRef: String,
		vnp_Amount: Number,
		vnp_OrderInfo: String,
		vnp_ResponseCode: String,
		vnp_BankCode: String,
		vnp_BankTranNo: String,
		vnp_PayDate: String,
		vnp_TransactionNo: String,
		vnp_SecureHash: String,
	},
	{ requiredByDefault: false }
);

const TEST_CONFIG = {
	merchant: 'COCOSIN',
	secureSecret: 'RAOEXHYVSDDIIENYWSLDIIZTANXUXZFJ',
	paymentGateway: 'http://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
};

export { TEST_CONFIG };
