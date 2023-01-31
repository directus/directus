/* eslint-disable no-console */
const { execSync } = require('child_process');

// Get path to package.json file of sharp
const sharpPackageJsonPath = execSync(
	'pnpm --filter directus exec node -e "console.log(require.resolve(\'sharp/package.json\'))"'
);

// Load the package.json file
const sharpPackageJson = require(String(sharpPackageJsonPath).trim());

// Print the required version of libvips
console.log(sharpPackageJson.config.libvips);
