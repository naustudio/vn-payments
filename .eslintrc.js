// Nau standard eslint rules, save it as .eslintrc.js
module.exports = {
	root: true,
	extends: ['nau'],
	rules: {
		'comma-dangle': [
			'error',
			{
				arrays: 'always-multiline',
				objects: 'always-multiline',
				imports: 'always-multiline',
				exports: 'always-multiline',
				functions: 'never',
			},
		],
		'key-spacing': 'off',
		'import/prefer-default-export': 'off',
		'jest/no-focused-tests': 'error',
		'jest/no-identical-title': 'error',
		'import/no-extraneous-dependencies': 'off',
	},
	globals: {},
	env: {
		browser: true,
		es6: true,
		node: true,
		jest: true,
	},
	parserOptions: {
		ecmaVersion: 6,
		sourceType: 'module',
		ecmaFeatures: {
			impliedStrict: true,
			classes: true,
		},
	},
	plugins: ['import', 'jest'],
	settings: {},
};
