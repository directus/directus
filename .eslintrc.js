const defaultRules = {
	'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
	'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
	'prettier/prettier': 'error',
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
};

module.exports = {
	root: true,
	env: {
		browser: true,
		node: true,
	},
	plugins: ['@typescript-eslint', 'prettier'],
	extends: ['eslint:recommended', 'prettier'],
	rules: defaultRules,
	parserOptions: {
		ecmaVersion: 2020,
	},
	overrides: [
		{
			files: ['rollup.config.js'],
			parserOptions: {
				sourceType: 'module',
			},
		},
		{
			files: ['*.ts', '*.vue'],
			parser: 'vue-eslint-parser',
			parserOptions: {
				parser: '@typescript-eslint/parser',
			},
			extends: [
				'plugin:vue/essential',
				'eslint:recommended',
				'plugin:@typescript-eslint/recommended',
				'plugin:prettier-vue/recommended',
				'prettier',
			],
			rules: {
				...defaultRules,
				'no-undef': 'off',
				'@typescript-eslint/ban-ts-comment': 0,
				'@typescript-eslint/no-explicit-any': 0,
				'@typescript-eslint/no-var-requires': 0,
				'@typescript-eslint/no-non-null-assertion': 0,
				'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
				'vue/valid-v-slot': 0,
			},
		},
	],
};
