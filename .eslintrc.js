module.exports = {
	root: true,
	env: {
		node: true
	},
	extends: [
		'plugin:vue/essential',
		'@vue/typescript/recommended',
		'@vue/prettier',
		'@vue/prettier/@typescript-eslint'
	],
	rules: {
		'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
		'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
		'prettier/prettier': ['error', { singleQuote: true }],
		'@typescript-eslint/camelcase': null,
		'@typescript-eslint/no-use-before-define': null,
		'@typescript-eslint/ban-ts-ignore': null
	},
	parserOptions: {
		parser: '@typescript-eslint/parser'
	},
	overrides: [
		{
			files: ['**/*.test.{js,ts}?(x)', '**/*.story.{js,ts}?(x)'],
			env: {
				jest: true
			},
			rules: {
				'@typescript-eslint/no-explicit-any': null,
				'@typescript-eslint/no-empty-function': null,
				'@typescript-eslint/no-non-null-assertion': null
			}
		}
	]
};
