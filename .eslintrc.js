const defaultRules = {
	// No console statements in production
	'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
	// No debugger statements in production
	'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
	// Enforce prettier formating
	'prettier/prettier': 'error',
};

module.exports = {
	// Stop looking for ESLint configurations in parent folders
	root: true,
	// Global variables: Browser and Node.js
	env: {
		browser: true,
		node: true,
	},
	// Basic configuration for js files
	plugins: ['@typescript-eslint', 'prettier'],
	extends: ['eslint:recommended', 'prettier'],
	rules: defaultRules,
	parserOptions: {
		ecmaVersion: 2020,
	},
	overrides: [
		// Parse rollup configration as module
		{
			files: ['rollup.config.js'],
			parserOptions: {
				sourceType: 'module',
			},
		},
		// Configuration for ts/vue files
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
				// It's recommended to turn off this rule on TypeScript projects
				'no-undef': 'off',
				// Allow ts-directive comments (used to suppress TypeScript compiler errors)
				'@typescript-eslint/ban-ts-comment': 0,
				// Allow usage of the any type (consider to enable this rule later on)
				'@typescript-eslint/no-explicit-any': 0,
				// Allow usage of require statements (consider to enable this rule later on)
				'@typescript-eslint/no-var-requires': 0,
				// Allow non-null assertions for now (consider to enable this rule later on)
				'@typescript-eslint/no-non-null-assertion': 0,
				// Allow unused variables when they begin with an underscore
				'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
				// Disable validity checks on v-slot directive (consider to enable this rule later on)
				'vue/valid-v-slot': 0,
			},
		},
	],
};
