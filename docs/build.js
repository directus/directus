const fse = require('fs-extra');
const path = require('path');
const { promisify } = require('util');
const copyfiles = promisify(require('copyfiles'));
const rimraf = promisify(require('rimraf'));
const dirTree = require('directory-tree');
const yaml = require('js-yaml');

async function build() {
	const distPath = path.resolve(__dirname, './dist');

	await rimraf(distPath);

	const tree = dirTree('.', { extensions: /\.md/, exclude: /dist/ });

	await fse.ensureDir(distPath);

	await fse.writeJSON('./dist/index.json', tree);

	await copyfiles(['./**/*.md', distPath]);

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
}

build();
