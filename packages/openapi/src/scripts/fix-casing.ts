// Added in https://github.com/directus/openapi/pull/25

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const specRoot = './openapi';

function getAllFiles(dir: string): string[] {
	return glob.sync(`${dir}/**/*.{yaml,yml}`, { nodir: true });
}

function buildPathMap(files: string[]): Map<string, string> {
	const map = new Map<string, string>();

	for (const file of files) {
		map.set(path.resolve(file).toLowerCase(), path.resolve(file));
	}

	return map;
}

function fixRefsInFile(file: string, pathMap: Map<string, string>) {
	const content = fs.readFileSync(file, 'utf8');
	const dir = path.dirname(file);

	const refRegex = /\$ref:\s*["']?([^\s"']+)["']?/g;
	let changed = false;

	const newContent = content.replace(refRegex, (match, refPath) => {
		if (refPath.startsWith('#') || refPath.includes('#/')) return match; // local or component ref

		// Normalize relative path — assume relative to current file
		const assumedPath = path.resolve(dir, refPath);
		const fixed = pathMap.get(assumedPath.toLowerCase());

		if (fixed && fixed !== assumedPath) {
			const relFixed = path.relative(dir, fixed).replace(/\\/g, '/');
			changed = true;
			return `$ref: ${relFixed}`;
		}

		return match;
	});

	if (changed) {
		fs.writeFileSync(file, newContent, 'utf8');
		// eslint-disable-next-line no-console
		console.log(`✔ Fixed refs in ${file}`);
	}
}

const files = getAllFiles(specRoot);
const pathMap = buildPathMap(files);
files.forEach((file) => fixRefsInFile(file, pathMap));
