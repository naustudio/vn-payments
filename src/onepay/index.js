/* © 2018 NauStud.io
 * @author Thanh Tran
 */
export { OnePayDomestic } from './OnePayDomestic';

export { OnePayInternational } from './OnePayInternational';

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
