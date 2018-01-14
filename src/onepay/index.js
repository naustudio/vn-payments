/* © 2018 NauStud.io
 * @author Thanh Tran
 */
import SimpleSchema from 'simpl-schema';

export { OnePayDomestic } from './OnePayDomestic';

export { OnePayInternational } from './OnePayInternational';

/* eslint-disable no-unused-vars */
// for reference, not used for now
const onepayDomReturnSchema = new SimpleSchema(
	{
		vpc_AdditionData: String,
		vpc_Amount: String,
		vpc_Command: String,
		vpc_CurrencyCode: String,
		vpc_Locale: String,
		vpc_MerchTxnRef: String,
		vpc_Merchant: String,
		vpc_OrderInfo: String,
		vpc_TransactionNo: String,
		vpc_TxnResponseCode: String,
		vpc_Version: String,
		vpc_SecureHash: String,
	},
	{ requiredByDefault: false }
);

// for reference, not used for now
const onepayIntlReturnSchema = new SimpleSchema(
	{
		vpc_OrderInfo: String,
		vpc_3DSECI: String,
		vpc_3DSenrolled: String,
		vpc_3DSXID: String,
		vpc_AcqAVSRespCode: String,
		vpc_AcqCSCRespCode: String,
		vpc_AcqResponseCode: String,
		vpc_Amount: String,
		vpc_AuthorizeId: String,
		vpc_AVS_City: String,
		vpc_AVS_Country: String,
		vpc_AVS_StateProv: String,
		vpc_AVS_Street01: String,
		vpc_AVSRequestCode: String,
		vpc_AVSResultCode: String,
		vpc_BatchNo: String,
		vpc_Card: String,
		vpc_CardLevelIndicator: String,
		vpc_CardNum: String,
		vpc_Command: String,
		vpc_CommercialCard: String,
		vpc_CommercialCardIndicator: String,
		vpc_CSCResultCode: String,
		vpc_Locale: String,
		vpc_MarketSpecificData: String,
		vpc_Merchant: String,
		vpc_MerchTxnRef: String,
		vpc_Message: String,
		vpc_ReceiptNo: String,
		vpc_ReturnACI: String,
		vpc_RiskOverallResult: String,
		vpc_SecureHash: String,
		vpc_TransactionIdentifier: String,
		vpc_TransactionNo: String,
		vpc_TxnResponseCode: String,
		vpc_VerSecurityLevel: String,
		vpc_Version: String,
		vpc_VerStatus: String,
		vpc_VerType: String,
	},
	{ requiredByDefault: false }
);

const TEST_DOM_CONFIG = {
	accessCode: 'D67342C2',
	merchant: 'ONEPAY',
	paymentGateway: 'https://mtf.onepay.vn/onecomm-pay/vpc.op',
	secureSecret: 'A3EFDFABA8653DF2342E8DAC29B51AF0',
};

const TEST_INTL_CONFIG = {
	accessCode: '6BEB2546',
	merchant: 'TESTONEPAY',
	paymentGateway: 'https://mtf.onepay.vn/vpcpay/vpcpay.op',
	secureSecret: '6D0870CDE5F24F34F3915FB0045120DB',
};

export { TEST_DOM_CONFIG, TEST_INTL_CONFIG };
