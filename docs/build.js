const fse = require('fs-extra');
const path = require('path');
const { promisify } = require('util');
const copyfiles = promisify(require('copyfiles'));
const rimraf = promisify(require('rimraf'));
const dirTree = require('directory-tree');
const yaml = require('js-yaml');

async function build() {
	console.log('Building docs...');

	const start = Date.now();

	const distPath = path.resolve(__dirname, './dist');

	await rimraf(distPath);

	const tree = dirTree('.', { extensions: /\.md/, exclude: /(dist|node_modules)/ });

	await fse.ensureDir(distPath);

	await fse.writeJSON('./dist/index.json', tree);

	await copyfiles(['./**/*.md', distPath], { exclude: './node_modules/**/*.*' });
	await copyfiles(['./assets/**/*.*', distPath], { exclude: './node_modules/**/*.*' });

	const yamlFiles = [];
	const filesInRoot = await fse.readdir(__dirname);

	for (const file of filesInRoot) {
		if (file.endsWith('.yaml')) {
			yamlFiles.push(file);
		}
	}

	for (const yamlFile of yamlFiles) {
		const yamlString = await fse.readFile(yamlFile, 'utf8');
		await fse.writeJSON(
			'./dist/' + yamlFile.replace('.yaml', '.json'),
			yaml.safeLoad(yamlString)
		);
	}

	console.log(`Built docs in ${Date.now() - start} ms`);
}

build();
