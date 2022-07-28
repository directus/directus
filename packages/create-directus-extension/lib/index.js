#!/usr/bin/env node
'use strict';

const inquirer = require('inquirer');
const { EXTENSION_TYPES, EXTENSION_LANGUAGES, APP_OR_HYBRID_EXTENSION_TYPES } = require('@directus/shared/constants');
const { create } = require('@directus/extensions-sdk/cli');

run();

async function run() {
	// eslint-disable-next-line no-console
	console.log('This utility will walk you through creating a Directus extension.\n');

	const { type, name, language, tailwind } = await inquirer.prompt([
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
		},
		{
			type: 'confirm',
			name: 'tailwind',
			message: 'Bootstrap with tailwindcss?',
			default: false,
			when: ({ type }) => APP_OR_HYBRID_EXTENSION_TYPES.includes(type),
		},
	]);

	await create(type, name, { language, tailwind });
}
