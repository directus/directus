#!/usr/bin/env node
'use strict';

/* eslint-disable no-console */

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { Command } from 'commander';
import { execa } from 'execa';
import fse from 'fs-extra';
import logSymbols from 'log-symbols';
import ora from 'ora';
import checkForUpdate from 'update-check';
import checkRequirements from './check-requirements.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(String(await fse.readFile(join(__dirname, '../package.json'), 'utf8')));

const program = new Command(pkg.name)
	.version(pkg.version)
	.arguments('<directory>')
	.description('Create a new Directus project')
	.action(create);

if (process.env.NODE_ENV !== 'test') {
	program.parse(process.argv);
}

export async function create(directory) {
	checkRequirements();

	const rootPath = resolve(directory);

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

	await fse.mkdir(join(rootPath, 'uploads'));
	await fse.mkdir(join(rootPath, 'extensions'));

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
		onError({ err, text: undefined });
	}

	try {
		await execa('npm', ['install', 'directus', '--omit=dev'], {
			cwd: rootPath,
			stdin: 'ignore',
		});
	} catch (err) {
		onError({ err, text: undefined });
	}

	spinner.stop();

	try {
		await execa('npx', ['directus', 'init'], {
			cwd: rootPath,
			stdio: 'inherit',
		});
	} catch {
		onError({ err: undefined, text: 'Error while initializing the project' });
	}

	try {
		const update = await checkForUpdate(pkg);

		if (update) {
			console.log();
			console.log(chalk.yellow.bold(`A new version of \`${pkg.name}\` is available!`));
			console.log('You can update by running: ' + chalk.cyan(`npm i -g ${pkg.name}@latest`));
			console.log();
		}
	} catch {
		onError({
			err: undefined,
			symbol: 'warning',
			exit: false,
			text: `Error while checking for newer version of \`${pkg.name}\``,
		});
	}

	process.exit(0);
}
