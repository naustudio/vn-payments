// this eslint config will be merged with project's config
module.exports = {
	extends: 'eslint:recommended',
	rules: {
		'no-console': 'off',
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
