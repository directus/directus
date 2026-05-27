#!/usr/bin/env node
'use strict';

import { BUNDLE_EXTENSION_TYPES, EXTENSION_LANGUAGES, EXTENSION_TYPES } from '@directus/extensions';
import { create } from '@directus/extensions-sdk/cli';
import inquirer from 'inquirer';

if (process.env.NODE_ENV !== 'test') {
	run();
}

export async function run() {
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
