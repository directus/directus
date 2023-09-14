import { ExtensionManifest } from '@directus/constants';
import fse from 'fs-extra';
import fetch from 'node-fetch';
import * as path from 'path';
import * as tar from 'tar';
import * as url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export async function fetchReadme(name: string, version: string, tarballUrl: string): Promise<string> {
	const downloadFolder = path.join(__dirname, '..', process.env['DOWNLOADS_FOLDER'] ?? 'downloads');

	if (!await fse.pathExists(downloadFolder)) {
		await fse.mkdirs(downloadFolder);
	}

	const extensionFolder = path.join(downloadFolder, name.replace(/[/\\]/g, '_') + '_' + version);
	const extensionFolderTemp = path.join(downloadFolder, name.replace(/[/\\]/g, '_') + '_' + version + '_temp');
	const localTarPath = path.join(extensionFolderTemp, 'tar.tgz');

	const tarFile = await fetch(tarballUrl);

	await fse.createFile(localTarPath);

	await fse.writeFile(localTarPath, Buffer.from(await tarFile.arrayBuffer()));

	await tar.extract({
		file: localTarPath,
		cwd: extensionFolderTemp,
	});

	await fse.move(path.join(extensionFolderTemp, 'package'), extensionFolder);
	await fse.remove(extensionFolderTemp);

	const manifest = await fse.readJSON(path.join(extensionFolder, 'package.json'));
	ExtensionManifest.parse(manifest);


	const files = await fse.readdir(extensionFolder)

	const readmeFile = files.find(file => /^readme(\.md|\.txt)?$/i.test(file))

	if (readmeFile === undefined) {
		throw new Error(`${name}: No readme found.`)
	}

	await fse.remove(extensionFolder);

	return await fse.readFile(path.join(extensionFolder, readmeFile), 'utf-8')

}
