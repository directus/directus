#!/usr/bin/env node
'use strict';

import inquirer from 'inquirer';
import { EXTENSION_LANGUAGES, EXTENSION_TYPES, BUNDLE_EXTENSION_TYPES } from '@directus/extensions';
import { create } from '@directus/extensions-sdk/cli';

if (process.env.NODE_ENV !== 'test') {
	run();
}

export async function run() {
	// Parse CLI arguments for non-interactive mode
	const args = process.argv.slice(2);
	const hasType = args.length > 0 && !args[0].startsWith('--');
	const hasName = args.length > 1 && !args[1].startsWith('--');

	if (hasType && hasName) {
		// Non-interactive mode
		const type = args[0];
		const name = args[1];

		// Parse options (--language, --no-install)
		const langIndex = args.findIndex((a) => a === '--language' || a === '-l');
		const language = langIndex !== -1 && args[langIndex + 1] ? args[langIndex + 1] : 'javascript';
		const install = !args.includes('--no-install');

		await create(type, name, { language, install });
		return;
	}

	// Interactive mode
	// eslint-disable-next-line no-console
	console.log('This utility will walk you through creating a Directus extension.\n');

	const { type, name, language, install } = await inquirer.prompt([
		{
			type: 'list',
			name: 'type',
			message: 'Choose the extension type',
			choices: EXTENSION_TYPES,
		},
		{
			type: 'input',
			name: 'name',
			message: 'Choose a name for the extension',
		},
		{
			type: 'list',
			name: 'language',
			message: 'Choose the language to use',
			choices: EXTENSION_LANGUAGES,
			when: ({ type }) => BUNDLE_EXTENSION_TYPES.includes(type) === false,
		},
		{
			type: 'confirm',
			name: 'install',
			message: 'Auto install dependencies?',
			default: true,
		},
	]);

	await create(type, name, { language, install });
}
