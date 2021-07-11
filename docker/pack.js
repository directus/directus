const { execSync } = require('child_process');
const { writeFileSync, mkdirSync, existsSync } = require('fs');
const path = require('path/posix');

const lernaListResult = execSync('npx lerna list --json'); //The "proper" way to do this with --include-dependencies and --scope won't work here because it includes devDependencies!

const list = JSON.parse(String(lernaListResult));
const apiPackageJSON = require(path.resolve(__dirname, '../api/package.json'));

const projectPackageJSON = {
	name: 'directus-project',
	version: '1.0.0',
	description: 'Directus Project',
	dependencies: apiPackageJSON.optionalDependencies,
};

const directusPackage = list.find((list) => list.name === 'directus');

if (!existsSync('dist')) {
	mkdirSync('dist');
}

function addPackageRecursive(package) {
	const tarName = String(
		execSync(`npm pack ${package.location}`, { cwd: path.resolve(__dirname, '..', 'dist') })
	).trim();
	projectPackageJSON.dependencies[package.name] = `file:${tarName}`;
	const packageJSON = require(path.join(package.location, 'package.json'));
	Object.keys(packageJSON.dependencies || {}).forEach((dependencyName) => {
		if (!projectPackageJSON.dependencies[dependencyName]) {
			const package = list.find((list) => list.name === dependencyName);
			if (package) {
				addPackageRecursive(package);
			}
		}
	});
}

addPackageRecursive(directusPackage);

writeFileSync(path.resolve(__dirname, '../dist/package.json'), JSON.stringify(projectPackageJSON, null, 4));
