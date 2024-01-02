import { Command, Option } from 'commander';
import { version } from 'directus/version';
import emitter from '../emitter.js';
import { startServer } from '../server.js';
import bootstrap from './commands/bootstrap/index.js';
import count from './commands/count/index.js';
import dbInstall from './commands/database/install.js';
import dbMigrate from './commands/database/migrate.js';
import init from './commands/init/index.js';
import rolesCreate from './commands/roles/create.js';
import { apply } from './commands/schema/apply.js';
import { snapshot } from './commands/schema/snapshot.js';
import keyGenerate from './commands/security/key.js';
import secretGenerate from './commands/security/secret.js';
import usersCreate from './commands/users/create.js';
import usersPasswd from './commands/users/passwd.js';
import { loadExtensions } from './load-extensions.js';

export async function createCli(): Promise<Command> {
	const program = new Command();

	await loadExtensions();

	await emitter.emitInit('cli.before', { program });

	program.name('directus').usage('[command] [options]');
	program.version(version, '-v, --version');

	program.command('start').description('Start the Directus API').action(startServer);
	program.command('init').description('Create a new Directus Project').action(init);

	// Security
	const securityCommand = program.command('security');
	securityCommand.command('key:generate').description('Generate the app key').action(keyGenerate);
	securityCommand.command('secret:generate').description('Generate the app secret').action(secretGenerate);

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

	const schemaCommands = program.command('schema');

	schemaCommands
		.command('snapshot')
		.description('Create a new Schema Snapshot')
		.option('-y, --yes', `Assume "yes" as answer to all prompts and run non-interactively`, false)
		.addOption(new Option('--format <format>', 'JSON or YAML format').choices(['json', 'yaml']).default('yaml'))
		.argument('[path]', 'Path to snapshot file')
		.action(snapshot);

	schemaCommands
		.command('apply')
		.description('Apply a snapshot file to the current database')
		.option('-y, --yes', `Assume "yes" as answer to all prompts and run non-interactively`)
		.option('-d, --dry-run', 'Plan and log changes to be applied', false)
		.argument('<path>', 'Path to snapshot file')
		.action(apply);

	await emitter.emitInit('cli.after', { program });

	return program;
}
