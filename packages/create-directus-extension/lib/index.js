#!/usr/bin/env node
'use strict';

import { BUNDLE_EXTENSION_TYPES, EXTENSION_LANGUAGES, EXTENSION_TYPES } from '@directus/extensions';
import { create } from '@directus/extensions-sdk/cli';
import { Command } from 'commander';
import inquirer from 'inquirer';

if (process.env.NODE_ENV !== 'test') {
	run();
}

export async function run(argv = process.argv) {
	const program = new Command('create-directus-extension')
		.description('Scaffold a Directus extension')
		.argument('[type]', 'extension type')
		.argument('[name]', 'extension name (required when type is provided)')
		.option('-l, --language <language>', 'specify the language to use')
		.option('--no-install', 'skip dependency installation after creating extension');

	program.parse(argv);

	const options = program.opts();
	const [type, name] = program.args;

	if (type) {
		// Both arguments are required for non-interactive mode.
		if (!name) {
			program.error('Missing required argument "name". Run without arguments for interactive mode.');
			return;
		}

		let language;

		if (BUNDLE_EXTENSION_TYPES.includes(type) === false) {
			language = options.language ?? 'javascript';
		}

		await create(type, name, { language, install: options.install });
		return;
	}

	// eslint-disable-next-line no-console
	console.log('This utility will walk you through creating a Directus extension.\n');

	const answers = await inquirer.prompt([
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

	await create(answers.type, answers.name, { language: answers.language, install: answers.install });
}
