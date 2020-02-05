module.exports = {
	root: true,
	env: {
		node: true
	},
	extends: ['plugin:vue/essential', '@vue/prettier', '@vue/typescript'],
	rules: {
		'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
		'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
		'prettier/prettier': ['error', { singleQuote: true }]
	},
	parserOptions: {
		parser: '@typescript-eslint/parser'
	},
	overrides: [
		{
			files: ['**/*.test.{js,ts}?(x)'],
			env: {
				jest: true
			}
		}
	]
};
