const path = require('path');

module.exports = {
	rootDir: path.resolve(__dirname, '../'),
	moduleFileExtensions: ['js', 'json'],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
	},
	coverageDirectory: '<rootDir>/test/coverage',
	collectCoverageFrom: ['src/**/*.js'],
};
