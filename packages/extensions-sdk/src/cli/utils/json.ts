import { readFile, writeFile } from 'node:fs/promises';

export async function readJson(path: string): Promise<any> {
	return JSON.parse(await readFile(path, 'utf8'));
}

export async function writeJson(path: string, data: unknown, indent: string | number = '\t'): Promise<void> {
	await writeFile(path, JSON.stringify(data, null, indent) + '\n');
}
