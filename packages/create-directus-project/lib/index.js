#!/usr/bin/env node
'use strict';

/* eslint-disable no-console */

import { mkdir, readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import chalk from 'chalk';
import { Command } from 'commander';
import { execa } from 'execa';
import logSymbols from 'log-symbols';
import ora from 'ora';
import checkForUpdate from 'update-check';
import checkRequirements from './check-requirements.js';

const pkg = JSON.parse(await readFile(join(import.meta.dirname, '../package.json'), 'utf8'));

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

	const rootStat = await stat(rootPath).catch((error) => {
		if (error.code === 'ENOENT') return null;
		throw error;
	});

	if (rootStat) {
		if (rootStat.isDirectory() === false) {
			console.error(`Destination '${chalk.blue(directory)}' already exists and is not a directory.`);
			process.exit(1);
		}

		const files = await readdir(rootPath);

		if (files.length > 0) {
			console.error(`Destination '${chalk.blue(directory)}' already exists and is not an empty directory.`);
			process.exit(1);
		}
	} else {
		await mkdir(rootPath);
	}

	await mkdir(join(rootPath, 'uploads'));
	await mkdir(join(rootPath, 'extensions'));

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
