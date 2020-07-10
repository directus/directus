#!/usr/bin/env node

import program from 'commander';

const pkg = require('../../package.json');

import start from './start';
import create from './create';

program.version(pkg.version, '-v, --version');

program.name('directus').usage('[command] [options]');

program.command('create <directory>').description('Create a new Directus Project').action(create);

program.command('start').description('Start the Directus API').action(start);

program.parseAsync(process.argv);
