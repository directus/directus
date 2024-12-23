// @ts-check

import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	// Global config
	{
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
	},

	// Ignored files
	{
		ignores: ['**/dist/', 'packages/extensions-sdk/templates/', 'docs/.vitepress/cache/', 'api/extensions/'],
	},

	// Enable recommended rules for JS files
	eslint.configs.recommended,

	// Custom basic rules
	{
		rules: {
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
			// Disallow expressions where the operation doesn't affect the value
			'no-constant-binary-expression': 'error',
		},
	},

	// Enable TypeScript plugin and recommended rules for TypeScript files
	...tseslint.configs.recommended,

	// Enable Vue plugin and recommended rules for Vue files
	// @ts-expect-error untyped package
	...eslintPluginVue.configs['flat/recommended'],
	{
		files: ['**/*.vue'],
		languageOptions: { parserOptions: { parser: tseslint.parser } },
		// Apply recommended TypeScript rules to Vue files as well
		rules: tseslint.configs.recommended.reduce((rules, config) => ({ ...rules, ...config.rules }), {}),
	},

	// Custom TypeScript rules
	{
		files: ['**/*.{ts,vue}'],
		rules: {
			// Allow unused arguments and variables when they begin with an underscore
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
			// Allow ts-directive comments (used to suppress TypeScript compiler errors)
			'@typescript-eslint/ban-ts-comment': 'off',
			// Allow usage of the any type (consider enabling this rule later on)
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},

	// Custom Vue rules
	{
		files: ['**/*.{ts,vue}'],
		rules: {
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
			// Allow unused variables when they begin with an underscore
			'vue/no-unused-vars': ['error', { ignorePattern: '^_' }],
		},
	},

	// Test files
	{
		files: ['**/*.test.ts'],
		rules: {
			'vue/one-component-per-file': 'off',
		},
	},

	eslintConfigPrettier,
);
