const tsFilesConfig = require('../.eslintrc.js').overrides.find((o) => o.files.includes('*.ts'));

/** @type {import('eslint').Linter.Config} */
module.exports = {
	ignorePatterns: ['/packages/**'],
	overrides: [
		// Apply TypeScript config to tsx files
		{
			...tsFilesConfig,
			files: [...tsFilesConfig.files, '*.tsx'],
		},
		// Code blocks in Markdown files
		{
			files: ['**/*.md'],
			plugins: ['markdown'],
			processor: 'markdown/markdown',
		},
		{
			files: ['**/*.md/**'],
			extends: ['plugin:prettier/recommended'],
			rules: {
				'prettier/prettier': ['warn', {}, { forceFormatExtracted: true }],
			},
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
		{
			files: ['**/*.md/*.{json,md,y?(a)ml,html,graphql,css}'],
			parser: 'eslint-parser-plain',
		},
	],
};
