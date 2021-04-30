#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const enabledDev = !!process.env.DIRECTUS_CLI_DEV;

const wantsGlobal = enabledDev && process.argv.indexOf('--use-global') >= 0;
const entrypoint = path.resolve('./node_modules/@directus/cli/bin/directus.js');
if (__filename !== entrypoint && fs.existsSync(entrypoint) && !wantsGlobal) {
	require(entrypoint);
	return;
}

require('dotenv').config();

const devMode = enabledDev && require('fs').existsSync(`${__dirname}/../src`);
const wantsCompiled = enabledDev && process.argv.indexOf('--use-compiled') >= 0;

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
