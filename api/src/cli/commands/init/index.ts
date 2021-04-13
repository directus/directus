import chalk from 'chalk';
import inquirer from 'inquirer';
import { databaseQuestions } from './questions';
import { drivers, getDriverForClient } from '../../utils/drivers';
import createEnv from '../../utils/create-env';
import { v4 as uuidV4 } from 'uuid';
import execa from 'execa';
import ora from 'ora';

import argon2 from 'argon2';

import runSeed from '../../../database/seeds/run';
import runMigrations from '../../../database/migrations/run';

import createDBConnection, { Credentials } from '../../utils/create-db-connection';
import { Knex } from 'knex';

export default async function init(options: Record<string, any>) {
	const rootPath = process.cwd();

	let { client } = await inquirer.prompt([
		{
			type: 'list',
			name: 'client',
			message: 'Choose your database client',
			choices: Object.values(drivers),
		},
	]);

	const dbClient = getDriverForClient(client)!;

	const spinnerDriver = ora('Installing Database Driver...').start();
	await execa('npm', ['install', dbClient, '--production']);
	spinnerDriver.stop();

	let attemptsRemaining = 5;

	const { credentials, db } = await trySeed();

	async function trySeed(): Promise<{ credentials: Credentials; db: Knex }> {
		const credentials: Credentials = await inquirer.prompt(
			(databaseQuestions[dbClient] as any[]).map((question: Function) =>
				question({ client: dbClient, filepath: rootPath })
			)
		);

		const db = createDBConnection(dbClient, credentials!);

		try {
			await runSeed(db);
			await runMigrations(db, 'latest');
		} catch (err) {
			console.log();
			console.log('Something went wrong while seeding the database:');
			console.log();
			console.log(`${chalk.red(`[${err.code || 'Error'}]`)} ${err.message}`);
			console.log();
			console.log('Please try again');
			console.log();
			attemptsRemaining--;

			if (attemptsRemaining > 0) {
				return await trySeed();
			} else {
				console.log(`Couldn't seed the database. Exiting.`);
				process.exit(1);
			}
		}

		return { credentials, db };
	}

	await createEnv(dbClient, credentials!, rootPath);

	console.log();
	console.log();

	console.log(`Create your first admin user:`);

	const firstUser = await inquirer.prompt([
		{
			type: 'input',
			name: 'email',
			message: 'Email',
			default: 'admin@example.com',
		},
		{
			type: 'password',
			name: 'password',
			message: 'Password',
			mask: '*',
			validate: (input: string | null) => {
				if (input === null || input === '') throw new Error('The password cannot be empty!');
				return true;
			},
		},
	]);

	firstUser.password = await argon2.hash(firstUser.password);

	const userID = uuidV4();
	const roleID = uuidV4();

	await db('directus_roles').insert({
		id: roleID,
		name: 'Administrator',
		icon: 'verified',
		admin_access: true,
		description: 'Initial administrative role with unrestricted App/API access',
	});

	await db('directus_users').insert({
		id: userID,
		status: 'active',
		email: firstUser.email,
		password: firstUser.password,
		first_name: 'Admin',
		last_name: 'User',
		role: roleID,
	});

	await db.destroy();

	console.log(`
Your project has been created at ${chalk.green(rootPath)}.

The configuration can be found in ${chalk.green(rootPath + '/.env')}

Start Directus by running:
  ${chalk.blue('cd')} ${rootPath}
  ${chalk.blue('npx directus')} start
`);

	process.exit(0);
}
