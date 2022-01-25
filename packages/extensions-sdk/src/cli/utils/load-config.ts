import path from 'path';
import fse from 'fs-extra';

const CONFIG_FILE_NAMES = ['extension.config.js', 'extension.config.mjs', 'extension.config.cjs'];

// This is needed to work around Typescript always transpiling import() to require() for CommonJS targets.
const _import = new Function('url', 'return import(url)');

export default async function loadConfig(): Promise<Record<string, any>> {
	for (const fileName of CONFIG_FILE_NAMES) {
		if (await fse.pathExists(fileName)) {
			const configFile = await _import(
				path.relative(__dirname, path.join(process.cwd(), fileName)).split(path.sep).join(path.posix.sep)
			);

			return configFile.default;
		}
	}

	return {};
}
