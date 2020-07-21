import fse from 'fs-extra';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { resolve } from 'path';
import { databaseQuestions } from './questions';
import { drivers, getDriverForClient } from './drivers';
import childProcess from 'child_process';
import { promisify } from 'util';
import createEnv from './env';

const exec = promisify(childProcess.exec);

import installDB, { Credentials } from './install-db';

export default async function create(directory: string, options: Record<string, any>) {
	const path = resolve(directory);
	checkRequirements();

	if (await fse.pathExists(path)) {
		const stat = await fse.stat(path);

		if (stat.isDirectory() === false) {
			console.error(
				`Destination '${chalk.red(directory)}' already exists and is not a directory.`
			);
			process.exit(1);
		}

		const files = await fse.readdir(path);

		if (files.length > 0) {
			console.error(
				`Destination '${chalk.red(
					directory
				)}' already exists and is not an empty directory.`
			);
			process.exit(1);
		}
	}

	await fse.mkdir(path);

	// await exec(`cd ${path} && npm init -y && npm install directus@preview`);

	let { client } = await inquirer.prompt([
		{
			type: 'list',
			name: 'client',
			message: 'Choose your database client',
			choices: Object.values(drivers),
		},
	]);

	const dbClient = getDriverForClient(client)!;

	const credentials: Credentials = await inquirer.prompt(
		(databaseQuestions[dbClient] as any[]).map((question: Function) => question({ client }))
	);

	// try {
	// 	await installDB(client, credentials);
	// } catch (error) {
	// 	console.log(`${chalk.red('Database Error')}: Couln't install the database:`);
	// 	console.log(error.message);
	// }

	await createEnv(client, credentials);
	// await exec(`cd && directus start`);
}

function checkRequirements() {
	const nodeVersion = process.versions.node;
	const major = +nodeVersion.split('.')[0];

	if (major < 12) {
		console.error(`You are running Node ${nodeVersion}.`);
		console.error('Directus requires Node 12 and up.');
		console.error('Please update your Node version and try again.');
		process.exit(1);
	}
}
