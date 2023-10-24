#!/usr/bin/env node
'use strict';

const commander = require('commander');
const path = require('path');
const chalk = require('chalk');
const fse = require('fs-extra');
const execa = require('execa');
const ora = require('ora');
const logSymbols = require('log-symbols');

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
			console.error(`Destination '${chalk.blue(directory)}' already exists and is not a directory.`);
			process.exit(1);
		}

		const files = await fse.readdir(rootPath);

		if (files.length > 0) {
			console.error(`Destination '${chalk.blue(directory)}' already exists and is not an empty directory.`);
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

	// Let's get into the Directus mood while waiting
	const bunnyFrames = [];
	const numOfSpaces = 3;
	for (let i = 0; i < numOfSpaces + 1; i++) {
		bunnyFrames[i] = ' '.repeat(i) + '🐰' + ' '.repeat(numOfSpaces - i);
	}
	bunnyFrames.push(...bunnyFrames.slice(1, -1).reverse());
	const spinner = ora({
		spinner: {
			interval: 520,
			frames: bunnyFrames,
		},
	});

	spinner.start(chalk.bold('Installing Directus'));

	const onError = ({ err, symbol = 'error', text, exit = true }) => {
		spinner.stopAndPersist({
			symbol: logSymbols[symbol] + ' '.repeat(numOfSpaces + 1),
			text: text ? chalk.bold(text) : undefined,
		});
		if (err) {
			console.error(err.stderr || err.stdout || 'Unknown error');
		}
		if (exit) {
			process.exit(1);
		}
	};

	try {
		await execa('npm', ['init', '-y'], {
			cwd: rootPath,
			stdin: 'ignore',
		});
	} catch (err) {
		onError({ err });
	}

	try {
		await execa('npm', ['install', 'directus', '--production'], {
			cwd: rootPath,
			stdin: 'ignore',
		});
	} catch (err) {
		onError({ err });
	}

	spinner.stop();

	try {
		await execa('npx', ['directus', 'init'], {
			cwd: rootPath,
			stdio: 'inherit',
		});
	} catch (err) {
		onError({ text: 'Error while initializing the project' });
	}

	try {
		const update = await checkForUpdate(pkg);
		if (update) {
			console.log();
			console.log(chalk.yellow.bold(`A new version of \`${pkg.name}\` is available!`));
			console.log('You can update by running: ' + chalk.cyan(`npm i -g ${pkg.name}@latest`));
			console.log();
		}
	} catch (err) {
		onError({
			symbol: 'warning',
			exit: false,
			text: `Error while checking for newer version of \`${pkg.name}\``,
		});
	}

	process.exit(0);
}
