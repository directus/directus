// @ts-check

import eslintJs from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintImportPlugin from 'eslint-plugin-import';
import eslintPluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import process from 'node:process';
import typescriptEslint from 'typescript-eslint';

export default typescriptEslint.config(
	// Global config
	{
		languageOptions: {
			ecmaVersion: 2023,
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
	},

	// Ignored files
	{
		ignores: ['**/dist/', 'packages/extensions-sdk/templates/', 'api/extensions/'],
	},

	// Enable recommended rules for JS files
	eslintJs.configs.recommended,

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
			// Sort members
			'sort-imports': [
				'error',
				{
					ignoreCase: true,
					ignoreDeclarationSort: true,
					allowSeparatedGroups: true,
				},
			],
		},
	},

	// Enable import plugin and custom rules for import sorting
	{
		plugins: { import: eslintImportPlugin },
		rules: {
			'import/order': [
				'error',
				{
					'newlines-between': 'never',
					alphabetize: {
						order: 'asc',
						orderImportKind: 'asc',
						caseInsensitive: true,
					},
				},
			],
		},
	},

	// Enable TypeScript plugin and recommended rules for TypeScript files
	...typescriptEslint.configs.recommended,

	// Enable Vue plugin and recommended rules for Vue files
	...eslintPluginVue.configs['flat/recommended'],
	{
		files: ['**/*.vue'],
		languageOptions: { parserOptions: { parser: typescriptEslint.parser } },
		// Apply recommended TypeScript rules to Vue files as well
		// @ts-expect-error wrong type assertion
		rules: typescriptEslint.configs.recommended.reduce((rules, config) => ({ ...rules, ...config.rules }), {}),
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
		files: ['**/*.vue'],
		rules: {
			// Same ordering of component tags everywhere
			'vue/block-order': [
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
			// Require components to be imported in the script block
			'vue/no-undef-components': [
				'error',
				{
					// Histoire components in *.story.vue files
					ignorePatterns: ['Story', 'Variant', 'Hst*'],
				},
			],
			// Require <PascalCase /> components in templates
			'vue/component-name-in-template-casing': [
				'error',
				'PascalCase',
				{
					// Check global component uses as well
					registeredComponentsOnly: false,
				},
			],
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
