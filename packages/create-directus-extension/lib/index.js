#!/usr/bin/env node
'use strict';

const inquirer = require('inquirer');
const { EXTENSION_TYPES } = require('@directus/shared/constants');
const { create } = require('@directus/extension-sdk/cli');

run();

async function run() {
	// eslint-disable-next-line no-console
	console.log('This utility will walk you through creating a Directus extension.\n');

	const { type, name } = await inquirer.prompt([
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
	]);

	await create(type, name);
}
