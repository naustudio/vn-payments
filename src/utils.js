/* © 2017 NauStud.io
 * @author Eric Tran
 */
import crypto from 'crypto';

const urlRegExp = /https?:\/\/.*/;

export { urlRegExp };

/**
 * Convenient function to convert String to upper case
 * @param {*} s
 */
export function toUpperCase(s = '') {
	if (typeof s !== 'string') {
		throw new Error('toUpperCase:param must be string');
	}

	return s.toUpperCase();
}

/**
 * Equivalent to PHP's `pack` function, use Node native Buffer
 * Note: PHP
 *     pack('H*', secretCode)
 * is equivalent to Node
 *     Buffer.from(secretCode, 'hex')
 *
 * @param {*} secret
 * @param {*} encoding
 */
export function pack(secret, encoding = 'hex') {
	return Buffer.from(secret, encoding);
}

/**
 * Equivalent to PHP's `hash_hmac` function
 * @param  {string} code       hashing algorithm
 * @param  {string} secureCode secure code to be hashed
 * @param  {Buffer} p          Secure secret packed into hex buffer
 * @return {string}            digested hash
 */
export function hashHmac(code, secureCode, p) {
	const hmac = crypto.createHmac(code, p);
	hmac.update(secureCode);

	return hmac.digest('hex');
}

/**
 * Convenient function to convert number to 2 digit number string
 * @param {*} number
 */
export function to2DigitNumber(number) {
	if (isNaN(number)) {
		throw new Error('to2DigitNumber:param must be a number');
	}
	if (!number) {
		return '00';
	}

	return `0${number}`.substr(-2, 2);
}

/**
 * Convenient function to convert date to format yyyyMMddHHmmss
 * @param {*} date
 */
export function vnPayDateFormat(date) {
	if (date.constructor.name !== 'Date') {
		throw new Error('vnPayDateFormat:param must be a date');
	}

	let result = '';
	result += date.getFullYear().toString();
	result += to2DigitNumber(date.getMonth() + 1);
	result += to2DigitNumber(date.getDate());
	result += to2DigitNumber(date.getHours());
	result += to2DigitNumber(date.getMinutes());
	result += to2DigitNumber(date.getSeconds());

	return result;
}

/**
 * Convenient function to create md5 hash from string
 * @param {*} data
 */
export function createMd5Hash(data) {
	return crypto
		.createHash('md5')
		.update(data)
		.digest('hex');
}
