#!/usr/bin/env node

import program from 'commander';

const pkg = require('../../package.json');

import start from './commands/start';
import init from './commands/init';

program.version(pkg.version, '-v, --version');

program.name('directus').usage('[command] [options]');

program.command('start').description('Start the Directus API').action(start);
program.command('init').description('Create a new Directus Project').action(init);

program.parseAsync(process.argv);
