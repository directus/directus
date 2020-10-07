const fse = require('fs-extra');
const path = require('path');
const { promisify } = require('util');
const copyfiles = promisify(require('copyfiles'));
const rimraf = promisify(require('rimraf'));
const dirTree = require('directory-tree');

async function build() {
	const distPath = path.resolve(__dirname, './dist');
	await rimraf(distPath);
	await fse.ensureDir(distPath);

	const tree = dirTree('.', { extensions: /\.md/ });
	await fse.writeFile('./dist/index.json', JSON.stringify(tree, null, '\t'));

	await copyfiles(['./**/*.md', distPath]);
}

build();
