import { create } from './src/cli/index.js';
import { languageToShort } from './src/cli/utils/languages.js';
import { JAVASCRIPT_FILE_EXTS } from '@directus/constants';
import { EXTENSION_LANGUAGES } from '@directus/extensions';
import { execa } from 'execa';
import fse from 'fs-extra';
import { resolve } from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';

const TEST_PREFIX = 'temp-extension';

afterAll(async () => {
	// Remove all temp test artifacts
	const testArtifacts = (await fse.readdir(process.cwd())).filter((file) => file.startsWith(TEST_PREFIX));

	for (const tempArtifact of testArtifacts) {
		await fse.remove(tempArtifact);
	}
});

describe('create and build', () => {
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
		}),
	)(
		`$extensionType extension with $configFileName config file`,
		async ({ extensionType, configFileName }) => {
			const currentTime = Date.now();

			for (const language of EXTENSION_LANGUAGES) {
				const testExtensionPath = `${TEST_PREFIX}-init-${extensionType}-${language}-${currentTime}`;

				// Create extension
				await create(extensionType, testExtensionPath, { language });

				if (extensionType === 'operation') {
					expect(fse.pathExistsSync(resolve(testExtensionPath, 'src', `api.${languageToShort(language)}`))).toBe(true);
					expect(fse.pathExistsSync(resolve(testExtensionPath, 'src', `app.${languageToShort(language)}`))).toBe(true);
				} else {
					expect(fse.pathExistsSync(resolve(testExtensionPath, 'src', `index.${languageToShort(language)}`))).toBe(
						true,
					);
				}

				// Add dummy config file to verify they are loaded properly when building the extension
				await fse.writeFile(resolve(testExtensionPath, configFileName), getConfigFileContent(configFileName));

				// Build extension
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
		30_000,
	);
});

describe('validate extension', async () => {
	const testExtensionPath = `${TEST_PREFIX}-validate-${Date.now()}`;

	const runValidate = (check: string) =>
		execa('node', ['../cli.js', 'validate', '--check', check], { cwd: testExtensionPath });

	// Create extension
	await create('interface', testExtensionPath, { language: 'javascript' });

	test('built-code', async () => {
		// Needs to be built first
		await expect(runValidate('built-code')).rejects.toEqual(
			expect.objectContaining({ stderr: expect.stringContaining('No dist/index.js directory') }),
		);

		// Build extension
		await execa('node', ['../cli.js', 'build'], { cwd: testExtensionPath });

		// Should pass now
		await expect(runValidate('built-code')).resolves.toEqual(
			expect.objectContaining({ stderr: expect.stringContaining('Extension is valid') }),
		);
	});

	test('directus-config', async () => {
		// Should pass with initial, unmodified state
		await expect(runValidate('directus-config')).resolves.toEqual(
			expect.objectContaining({ stderr: expect.stringContaining('Extension is valid') }),
		);
	});

	test('license', async () => {
		// License needs to be defined by hand first
		await expect(runValidate('license')).rejects.toEqual(
			expect.objectContaining({ stderr: expect.stringContaining('[Error] license: No license defined') }),
		);

		// Add license field
		const packageJsonPath = resolve(testExtensionPath, 'package.json');
		const packageJson = await fse.readJson(packageJsonPath);
		packageJson.license = 'MIT';
		await fse.writeJson(packageJsonPath, packageJson);

		// Should pass now
		await expect(runValidate('license')).resolves.toEqual(
			expect.objectContaining({ stderr: expect.stringContaining('Extension is valid') }),
		);
	});

	test('readme', async () => {
		// Readme needs to be created by hand first
		await expect(runValidate('readme')).rejects.toEqual(
			expect.objectContaining({ stderr: expect.stringContaining('[Error] readme: No readme file found') }),
		);

		// Create readme
		const readmePath = resolve(testExtensionPath, 'readme.md');
		await fse.writeFile(readmePath, '# My Awesome Extension');

		// Should pass now
		await expect(runValidate('readme')).resolves.toEqual(
			expect.objectContaining({ stderr: expect.stringContaining('Extension is valid') }),
		);
	});
}, 30_000); // Bump up timeout duration as the build process can take slightly longer to complete
