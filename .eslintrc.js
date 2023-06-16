const basicRules = {
	// No console & debugger statements in production
	'no-console': process.env.NODE_ENV !== 'development' ? 'error' : 'off',
	'no-debugger': process.env.NODE_ENV !== 'development' ? 'error' : 'off',
	// Custom formatting rules
	'padding-line-between-statements': [
		'error',
		{
			blankLine: 'always',
			prev: [
				'block',
				'block-like',
				'cjs-export',
				'class',
				'export',
				'import',
				'multiline-block-like',
				'multiline-const',
				'multiline-expression',
				'multiline-let',
				'multiline-var',
			],
			next: '*',
		},
		{
			blankLine: 'always',
			prev: ['const', 'let'],
			next: ['block', 'block-like', 'cjs-export', 'class', 'export', 'import'],
		},
		{
			blankLine: 'always',
			prev: '*',
			next: ['multiline-block-like', 'multiline-const', 'multiline-expression', 'multiline-let', 'multiline-var'],
		},
		{ blankLine: 'any', prev: ['export', 'import'], next: ['export', 'import'] },
	],
	'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
	'no-nested-ternary': 'error',
	curly: ['error', 'multi-line'],
	// Disregard '.prettierignore' file
	'prettier/prettier': [
		'error',
		{},
		{
			fileInfoOptions: {
				ignorePath: null,
			},
		},
	],
};

// Fetch TypeScript rules directly to enable matching Vue files as well
const tsPlugin = require('@typescript-eslint/eslint-plugin');

const tsRecommendedRules = {
	// Disables core rules which are already handled by TypeScript and
	// enables rules that make sense due to TS's typechecking / transpilation
	...tsPlugin.configs['eslint-recommended'].overrides[0].rules,
	// Recommended TypeScript rules for code correctness
	...tsPlugin.configs.recommended.rules,
};

const tsRules = {
	// Allow unused arguments and variables when they begin with an underscore
	'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
	// Allow ts-directive comments (used to suppress TypeScript compiler errors)
	'@typescript-eslint/ban-ts-comment': 'off',
	// Allow usage of the any type (consider enabling this rule later on)
	'@typescript-eslint/no-explicit-any': 'off',
	// Allow usage of require statements (consider enabling this rule later on)
	'@typescript-eslint/no-var-requires': 'off',
	// Allow non-null assertions (consider enabling this rule later on)
	'@typescript-eslint/no-non-null-assertion': 'off',
};

const vueRules = {
	'vue/multi-word-component-names': 'off',
	'vue/require-default-prop': 'off',
};

const getExtends = (configs = []) => [
	// Enables a subset of core rules that report common problems
	'eslint:recommended',
	...configs,
	// Enables Prettier plugin and turns off some ESLint rules
	// that conflict with Prettier (eslint-config-prettier)
	// (should always be the last entry in 'extends')
	'plugin:prettier/recommended',
];

/** @type {import('eslint').Linter.Config} */
module.exports = {
	// Stop looking for other ESLint configurations in parent folders
	root: true,
	// Global variables: Browser and Node.js
	env: {
		browser: true,
		node: true,
	},
	// Basic configuration
	extends: getExtends(),
	rules: basicRules,
	parserOptions: {
		ecmaVersion: 2022,
		sourceType: 'module',
	},
	overrides: [
		// Configuration for TypeScript & Vue files
		{
			files: ['*.ts?(x)', '*.vue'],
			parser: 'vue-eslint-parser',
			parserOptions: {
				parser: '@typescript-eslint/parser',
			},
			plugins: ['@typescript-eslint'],
			extends: getExtends([
				// Enables Vue plugin and recommended rules
				'plugin:vue/vue3-recommended',
			]),
			rules: {
				...tsRecommendedRules,
				...tsRules,
				...vueRules,
			},
		},
		// Lint code blocks in Markdown files under '/docs'
		{
			files: ['docs/**/*.md'],
			plugins: ['markdown'],
			processor: 'markdown/markdown',
		},
		{
			files: ['**/*.md/*.{js,ts,vue,jsx,tsx}'],
			rules: {
				'no-console': 'off',
				'no-undef': 'off',
				'no-unused-vars': 'off',
				'@typescript-eslint/no-unused-vars': 'off',
			},
		},
		{
			files: ['**/*.md/*.{jsx,tsx}'],
			extends: ['plugin:react/jsx-runtime'],
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
			settings: {
				react: {
					version: '18',
				},
			},
		},
	],
};
