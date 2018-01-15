import { toUpperCase, pack, to2DigitNumber, hashHmac, vnPayDateFormat, createMd5Hash } from '../src/utils';

describe('Utils toUpperCase', () => {
	test('string to uppercase', () => {
		expect(toUpperCase('test')).toBe('TEST');
	});

	test('throws on uppercase is not string', () => {
		expect(() => {
			toUpperCase(1);
		}).toThrow();
	});

	test('pack', () => {
		const hash = pack('6D0870CDE5F24F34F3915FB0045120DB');

		expect(hash.toString()).toBe('m\bp���O4�_�\u0004Q �');
	});

	test('hashMac', () => {
		expect(hashHmac('SHA256', 'secret', 'The quick brown fox jumped over the lazy dog.')).toBe(
			'e780c36727cd55dfc2f2a2a7fdef060701dde78af67d78fc467a96f70ea27503'
		);
	});

	test('to2DigitNumber', () => {
		expect(to2DigitNumber(1)).toBe('01');
	});

	test('to2DigitNumber not number', () => {
		expect(() => {
			to2DigitNumber('s');
		}).toThrow();
	});

	test('vnPayDateFormat', () => {
		expect(vnPayDateFormat(new Date('2018/1/14'))).toBe('20180114000000');
	});

	test('vnPayDateFormat not date', () => {
		expect(() => {
			vnPayDateFormat(1);
		}).toThrow();
	});

	test('createMd5Hash', () => {
		expect(createMd5Hash('NauStudio')).toBe('4d5b3b71043b8def75d1594c55c5f1fd');
	});
});
