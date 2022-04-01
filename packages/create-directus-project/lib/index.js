#!/usr/bin/env node
'use strict';

const commander = require('commander');
const path = require('path');
const chalk = require('chalk');
const fse = require('fs-extra');
const execa = require('execa');
const ora = require('ora');

const pkg = require('../package.json');
const checkRequirements = require('./check-requirements');
const checkForUpdate = require('update-check');

const program = new commander.Command(pkg.name);

program
	.version(pkg.version)
	.arguments('<directory>')
	.description('Create a new Directus project')
	.action(create)
	.parse(process.argv);

async function create(directory) {
	checkRequirements();

	const rootPath = path.resolve(directory);

	if (await fse.pathExists(rootPath)) {
		const stat = await fse.stat(rootPath);

		if (stat.isDirectory() === false) {
			// eslint-disable-next-line no-console
			console.log(`Destination ${chalk.red(directory)} already exists and is not a directory.`);
			process.exit(1);
		}

		const files = await fse.readdir(rootPath);

		if (files.length > 0) {
			// eslint-disable-next-line no-console
			console.log(`Destination ${chalk.red(directory)} already exists and is not an empty directory.`);
			process.exit(1);
		}
	} else {
		await fse.mkdir(rootPath);
	}

	await fse.mkdir(path.join(rootPath, 'uploads'));
	await fse.mkdir(path.join(rootPath, 'extensions'));

	const extensionFolders = ['interfaces', 'displays', 'layouts', 'modules'];

	for (const folderName of extensionFolders) {
		await fse.mkdir(path.join(rootPath, 'extensions', folderName));
	}

	const spinner = ora('Installing Directus').start();

	try {
		await execa('npm', ['init', '-y'], {
			cwd: rootPath,
			stdin: 'ignore',
		});
	} catch (err) {
		spinner.fail();
		// eslint-disable-next-line no-console
		console.log(`Error: ${err.stderr}`);
		process.exit(1);
	}

	try {
		await execa('npm', ['install', 'directus', '--production', '--no-optional'], {
			cwd: rootPath,
			stdin: 'ignore',
		});
	} catch (err) {
		spinner.fail();
		// eslint-disable-next-line no-console
		console.log(`Error: ${err.stderr}`);
		process.exit(1);
	}

	spinner.stop();

	try {
		await execa('npx', ['directus', 'init'], {
			cwd: rootPath,
			stdio: 'inherit',
		});
	} catch (err) {
		spinner.fail();
		// eslint-disable-next-line no-console
		console.log(`Error: ${err.stderr}`);
		process.exit(1);
	}

	let update;

	try {
		update = await checkForUpdate(pkg);
	} catch (err) {
		// eslint-disable-next-line no-console
		console.log(`Error: ${err.stderr}`);
	}

	if (update) {
		// eslint-disable-next-line no-console
		console.log();
		// eslint-disable-next-line no-console
		console.log(chalk.yellow.bold(`A new version of \`${pkg.name}\` is available!`));
		// eslint-disable-next-line no-console
		console.log('You can update by running: ' + chalk.cyan(`npm i -g ${pkg.name}@latest`));
		// eslint-disable-next-line no-console
		console.log();
	}

	process.exit(0);
}
