#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const entrypoint = path.resolve('./node_modules/@directus/cli/bin/directus.js');
if (__filename !== entrypoint && fs.existsSync(entrypoint)) {
	require(entrypoint);
	return;
}

require('dotenv').config();

const amp = require('app-module-path');

amp.addPath(`${__dirname}/../node_modules`);
amp.addPath(`${process.cwd()}/node_modules`);
amp.addPath(process.cwd());

const devMode = require('fs').existsSync(`${__dirname}/../src`);
const wantsCompiled = process.argv.indexOf('--compiled-build') >= 0;

async function main(run, ts = false) {
	const debug = require('debug')('directus-cli');
	try {
		const { error, output } = await run(process.argv, ts);
		if (error) {
			debug(error);
		}

		if (output) {
			await output.flush(process.stdout);
			process.stdout.write('\n');
		}

		process.exit(error ? 1 : 0);
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
}

let run = () => {};
if (wantsCompiled || !devMode) {
	run = require(`${__dirname}/../dist/index`).default;
} else {
	process.env.DEBUG = `${process.env.DEBUG ?? ''}directus-cli`;
	require('ts-node').register({ project: `${__dirname}/../tsconfig.json` });
	run = require(`${__dirname}/../src/index`).default;
}

main(run);
