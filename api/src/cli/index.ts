#!/usr/bin/env node

import program from 'commander';

const pkg = require('../../package.json');

import start from './commands/start';
import init from './commands/init';
import dbInstall from './commands/database/install';
import dbMigrate from './commands/database/migrate';
import userCreate from './commands/user/create';

program.name('directus').usage('[command] [options]');
program.version(pkg.version, '-v, --version');

program.command('start').description('Start the Directus API').action(start);
program.command('init').description('Create a new Directus Project').action(init);

const dbCommand = program.command('database');
dbCommand.command('install').description('Install the database').action(dbInstall);
dbCommand.command('migrate:latest').description('Upgrade the database').action(() => dbMigrate('latest'));
dbCommand.command('migrate:up').description('Upgrade the database').action(() => dbMigrate('up'));
dbCommand.command('migrate:down').description('Downgrade the database').action(() => dbMigrate('down'));

const userCommand = program.command('user');

userCommand
	.command('create')
	.description('Create a new user')
	.option('-e, --email <email>', `user's email`)
	.option('-p, --password <password>', `user's password`)
	.action(userCreate);

program.parse(process.argv);
