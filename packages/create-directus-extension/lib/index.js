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
		.argument('[name]', 'extension name')
		.option('-t, --type <type>', 'specify the extension type')
		.option('-n, --name <name>', 'specify the extension name')
		.option('-l, --language <language>', 'specify the language to use')
		.option('--no-install', 'skip dependency installation after creating extension');

	program.parse(argv);

	const options = program.opts();
	const [positionalType, positionalName] = program.args;
	const type = options.type ?? positionalType;
	const name = options.name ?? positionalName;
	const install = options.install ?? true;

	if (type && name) {
		const language = BUNDLE_EXTENSION_TYPES.includes(type) ? undefined : (options.language ?? 'javascript');

		await create(type, name, { language, install });
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
			default: type,
		},
		{
			type: 'input',
			name: 'name',
			message: 'Choose a name for the extension',
			default: name,
		},
		{
			type: 'list',
			name: 'language',
			message: 'Choose the language to use',
			choices: EXTENSION_LANGUAGES,
			default: options.language,
			when: ({ type }) => BUNDLE_EXTENSION_TYPES.includes(type) === false,
		},
		{
			type: 'confirm',
			name: 'install',
			message: 'Auto install dependencies?',
			default: install,
		},
	]);

	await create(answers.type, answers.name, { language: answers.language, install: answers.install });
}
