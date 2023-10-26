const basicRules = {
	// No console & debugger statements in production
	'no-console': process.env.NODE_ENV !== 'development' ? 'error' : 'off',
	'no-debugger': process.env.NODE_ENV !== 'development' ? 'error' : 'off',
	// Require empty line between certain statements
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
	// Require empty line between class members
	'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
	// Disallow nested ternary expressions
	'no-nested-ternary': 'error',
	// Require brace style for multi-line control statements
	curly: ['error', 'multi-line'],
};

const tsRules = {
	// Allow unused arguments and variables when they begin with an underscore
	'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
	// Allow ts-directive comments (used to suppress TypeScript compiler errors)
	'@typescript-eslint/ban-ts-comment': 'off',
	// Allow usage of the any type (consider enabling this rule later on)
	'@typescript-eslint/no-explicit-any': 'off',
};

const vueRules = {
	// Same ordering of component tags everywhere
	'vue/component-tags-order': [
		'error',
		{
			order: ['script', 'template', 'style'],
		},
	],
	// Require empty line between component tags
	'vue/padding-line-between-blocks': 'error',
	// Allow single word component names ("Example" instead of "MyExample")
	'vue/multi-word-component-names': 'off',
	// Don't require default value for props that are not marked as required
	'vue/require-default-prop': 'off',
	// Require shorthand form attribute when v-bind value is true
	'vue/prefer-true-attribute-shorthand': 'error',
};

const getExtends = (configs = []) => [
	// Enables a subset of core rules that report common problems
	'eslint:recommended',
	...configs,
	// Turns off rules from other configs that are
	// unnecessary or might conflict with Prettier
	// (should always be the last entry in 'extends')
	'prettier',
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
	reportUnusedDisableDirectives: true,
	overrides: [
		// TypeScript & Vue files
		{
			files: ['*.ts', '*.vue'],
			parser: 'vue-eslint-parser',
			parserOptions: {
				parser: '@typescript-eslint/parser',
			},
			plugins: ['@typescript-eslint'],
			extends: getExtends([
				// Recommended TypeScript rules for code correctness
				'plugin:@typescript-eslint/recommended',
				// Enables Vue plugin and recommended rules
				'plugin:vue/vue3-recommended',
			]),
			rules: {
				// Disables core rules which are already handled by TypeScript and
				// enables rules that make sense due to TS's typechecking / transpilation
				// (fetched directly to enable it for Vue files too)
				...require('@typescript-eslint/eslint-plugin').configs['eslint-recommended'].overrides[0].rules,
				...tsRules,
				...vueRules,
			},
		},
	],
};
