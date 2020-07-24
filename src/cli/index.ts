#!/usr/bin/env node

import program from 'commander';

const pkg = require('../../package.json');

program.version(pkg.version, '-v, --version');

program.name('directus').usage('[command] [options]');

program
	.command('create <directory>')
	.description('Create a new Directus Project')
	.action(require('./commands/create'));
program.command('start').description('Start the Directus API').action(require('./commands/start'));

program.parseAsync(process.argv);
