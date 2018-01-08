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
		'import/prefer-default-export': 'off',
		'jest/no-focused-tests': 2,
		'jest/no-identical-title': 2,
	},
	globals: {
		Modernizr: true,
		hyperform: true,
	},
	env: {
		browser: true,
		es6: true,
		node: true,
		jest: true,
	},
	parser: 'babel-eslint',
	parserOptions: {
		ecmaVersion: 8,
		sourceType: 'module',
		ecmaFeatures: {
			impliedStrict: true,
			// 'jsx': true,
			// 'classes': true,
		},
	},
	plugins: ['import', 'jest'],
	settings: {},
};
