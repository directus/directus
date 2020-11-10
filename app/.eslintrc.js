module.exports = {
	root: true,
	env: {
		node: true,
	},
	extends: [
		'plugin:vue/essential',
		'@vue/typescript/recommended',
		'@vue/prettier',
		'@vue/prettier/@typescript-eslint',
	],
	rules: {
		'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
		'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
		'prettier/prettier': ['error', { singleQuote: true }],
		'@typescript-eslint/camelcase': 0,
		'@typescript-eslint/no-use-before-define': 0,
		'@typescript-eslint/ban-ts-ignore': 0,
		'@typescript-eslint/no-explicit-any': 0,
		'vue/valid-v-slot': 0,
		'comma-dangle': [
			'error',
			{
				arrays: 'always-multiline',
				exports: 'always-multiline',
				functions: 'never',
				imports: 'always-multiline',
				objects: 'always-multiline',
			},
		],
	},
	parserOptions: {
		parser: '@typescript-eslint/parser',
	},
};
