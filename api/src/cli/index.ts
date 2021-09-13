import { Command } from 'commander';
import start from '../start';
import { emitAsyncSafe } from '../emitter';
import { initializeExtensions, registerExtensionHooks } from '../extensions';
import bootstrap from './commands/bootstrap';
import count from './commands/count';
import dbInstall from './commands/database/install';
import dbMigrate from './commands/database/migrate';
import init from './commands/init';
import rolesCreate from './commands/roles/create';
import usersCreate from './commands/users/create';
import usersPasswd from './commands/users/passwd';

const pkg = require('../../package.json');

export async function createCli(): Promise<Command> {
	const program = new Command();

	await initializeExtensions();
	registerExtensionHooks();

	await emitAsyncSafe('cli.init.before', { program });

	program.name('directus').usage('[command] [options]');
	program.version(pkg.version, '-v, --version');

	program.command('start').description('Start the Directus API').action(start);
	program.command('init').description('Create a new Directus Project').action(init);

	const dbCommand = program.command('database');
	dbCommand.command('install').description('Install the database').action(dbInstall);
	dbCommand
		.command('migrate:latest')
		.description('Upgrade the database')
		.action(() => dbMigrate('latest'));
	dbCommand
		.command('migrate:up')
		.description('Upgrade the database')
		.action(() => dbMigrate('up'));
	dbCommand
		.command('migrate:down')
		.description('Downgrade the database')
		.action(() => dbMigrate('down'));

	const usersCommand = program.command('users');

	usersCommand
		.command('create')
		.description('Create a new user')
		.option('--email <value>', `user's email`)
		.option('--password <value>', `user's password`)
		.option('--role <value>', `user's role`)
		.action(usersCreate);

	usersCommand
		.command('passwd')
		.description('Set user password')
		.option('--email <value>', `user's email`)
		.option('--password <value>', `user's new password`)
		.action(usersPasswd);

	const rolesCommand = program.command('roles');
	rolesCommand
		.command('create')
		.description('Create a new role')
		.option('--role <value>', `name for the role`)
		.option('--admin', `whether or not the role has admin access`)
		.action(rolesCreate);

	program.command('count <collection>').description('Count the amount of items in a given collection').action(count);

	program
		.command('bootstrap')
		.description('Initialize or update the database')
		.option('--skipAdminInit', 'Skips the creation of the default Admin Role and User')
		.action(bootstrap);

	await emitAsyncSafe('cli.init.after', { program });

	return program;
}
