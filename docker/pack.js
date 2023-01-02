const { execSync } = require('child_process');
const { writeFileSync, mkdirSync, existsSync } = require('fs');
const path = require('path');

const packagesInWorkSpace = execSync('pnpm ls --depth -1 -r --json');

const list = JSON.parse(String(packagesInWorkSpace)).filter((pkg) => pkg.name !== 'directus-monorepo');

const apiPackageJson = require(path.resolve(__dirname, '../api/package.json'));

const projectPackageJson = {
	name: 'directus-project',
	private: true,
	description: 'Directus Project',
	dependencies: apiPackageJson.optionalDependencies,
};

const directusPackage = list.find((list) => list.name === 'directus');

const distFolder = path.resolve(__dirname, '..', 'dist');
if (!existsSync(distFolder)) {
	mkdirSync(distFolder);
}

function addPackageRecursive(package) {
	const tarName = path.basename(
		String(execSync(`pnpm -F ${package.name} exec pnpm pack --pack-destination ${distFolder}`)).trim()
	);

	projectPackageJson.dependencies[package.name] = `file:./${tarName}`;

	const packageJson = require(path.join(package.path, 'package.json'));

	Object.keys(packageJson.dependencies || {}).forEach((dependencyName) => {
		if (!projectPackageJson.dependencies[dependencyName]) {
			const package = list.find((list) => list.name === dependencyName);

			if (package) {
				addPackageRecursive(package);
			}
		}
	});
}

addPackageRecursive(directusPackage);

writeFileSync(path.resolve(__dirname, '../dist/package.json'), JSON.stringify(projectPackageJson, null, 4));
