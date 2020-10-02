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
			console.log(
				`Destination ${chalk.red(directory)} already exists and is not a directory.`
			);
			process.exit(1);
		}

		const files = await fse.readdir(rootPath);

		if (files.length > 0) {
			console.log(
				`Destination ${chalk.red(directory)} already exists and is not an empty directory.`
			);
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

	await execa('npm', ['init', '-y'], {
		cwd: rootPath,
		stdin: 'ignore',
	});

	await execa('npm', ['install', 'directus', '--production', '--no-optional'], {
		cwd: rootPath,
		stdin: 'ignore',
	});

	spinner.stop();

	await execa('npx', ['directus', 'init'], {
		cwd: rootPath,
		stdio: 'inherit',
	});

	process.exit(0);
}
