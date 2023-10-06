import { JAVASCRIPT_FILE_EXTS } from '@directus/constants';
import { EXTENSION_LANGUAGES } from '@directus/extensions';
import { execa } from 'execa';
import fse from 'fs-extra';
import { resolve } from 'node:path';
import { afterAll, expect, test } from 'vitest';
import { create } from './src/cli/index.js';
import { languageToShort } from './src/cli/utils/languages.js';

const testPrefix = `temp-extension`;

afterAll(async () => {
	// Remove all temp test artifacts
	const testArtifacts = (await fse.readdir(process.cwd())).filter((file) => file.startsWith(testPrefix));

	for (const tempArtifact of testArtifacts) {
		await fse.remove(tempArtifact);
	}
});

function getConfigFileContent(configFileName: string) {
	switch (configFileName) {
		case 'extension.config.js':
		case 'extension.config.mjs':
			return `export default { plugins: [] };`;
		case 'extension.config.cjs':
			return `module.exports = { plugins: [] };`;
		default:
			return '';
	}
}

// Test one extension from each of app/api/hybrid extensions, and each config file names
test.each(
	['interface', 'endpoint', 'operation'].map((extensionType, index) => {
		return { extensionType, configFileName: `extension.config.${JAVASCRIPT_FILE_EXTS[index]}` };
	})
)(
	`create and build new $extensionType extension with $configFileName config file`,
	async ({ extensionType, configFileName }) => {
		const currentTime = Date.now();

		for (const language of EXTENSION_LANGUAGES) {
			const testExtensionPath = `${testPrefix}-${extensionType}-${language}-${currentTime}`;

			// Create
			await create(extensionType, testExtensionPath, { language });

			if (extensionType === 'operation') {
				expect(fse.pathExistsSync(resolve(testExtensionPath, 'src', `api.${languageToShort(language)}`))).toBe(true);
				expect(fse.pathExistsSync(resolve(testExtensionPath, 'src', `app.${languageToShort(language)}`))).toBe(true);
			} else {
				expect(fse.pathExistsSync(resolve(testExtensionPath, 'src', `index.${languageToShort(language)}`))).toBe(true);
			}

			// Add dummy config file to verify they are loaded properly when building the extension
			await fse.outputFile(resolve(testExtensionPath, configFileName), getConfigFileContent(configFileName));
			expect(fse.pathExistsSync(resolve(testExtensionPath, configFileName))).toBe(true);

			// Build
			await execa('node', ['../cli.js', 'build'], { cwd: testExtensionPath });

			if (extensionType === 'operation') {
				expect(fse.pathExistsSync(resolve(testExtensionPath, 'dist', 'api.js'))).toBe(true);
				expect(fse.pathExistsSync(resolve(testExtensionPath, 'dist', 'app.js'))).toBe(true);
			} else {
				expect(fse.pathExistsSync(resolve(testExtensionPath, 'dist', 'index.js'))).toBe(true);
			}
		}
	},
	// Bump up timeout duration as the build process can take slightly longer to complete
	30_000
);
