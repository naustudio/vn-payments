// Nau standard eslint rules, save it as .eslintrc.js
module.exports = {
	root: true,
	extends: 'eslint:recommended',
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
		'no-console': 'off',
	},
	globals: {
		Modernizr: true,
		hyperform: true,
	},
	env: {
		browser: true,
		jquery: true,
	},
	parserOptions: {
		ecmaVersion: 5,
		ecmaFeatures: {
			impliedStrict: true,
		},
	},
};
