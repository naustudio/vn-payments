import { OnePayDomestic, OnePayInternational, NganLuong, VNPay, SohaPay } from '../src';

describe('Package index', () => {
	it('should export OnePayDomestic class', () => {
		expect(typeof OnePayDomestic).toEqual('function');
	});

	it('should export OnePayInternational class', () => {
		expect(typeof OnePayInternational).toEqual('function');
	});

	it('should export VNPay class', () => {
		expect(typeof VNPay).toEqual('function');
	});

	it('should export SohaPay class', () => {
		expect(typeof SohaPay).toEqual('function');
	});

	it('should export NganLuong class', () => {
		expect(typeof NganLuong).toEqual('function');
	});
});

// describe('GET /404', () => {
// 	it('should return 404 for non-existent URLs', async () => {
// 		await request(app)
// 			.get('/404')
// 			.expect(404);
// 		await request(app)
// 			.get('/notfound')
// 			.expect(404);
// 	});
// });
