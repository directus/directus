#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

require('dotenv').config();

const startupOptions = {
	devMode: !!process.env.DIRECTUS_CLI_DEV && fs.existsSync(`${__dirname}/../src`),
	useGlobal: !!process.env.DIRECTUS_CLI_DEV && !!process.env.DIRECTUS_CLI_DEV_USE_GLOBAL,
	useCompiled: !!process.env.DIRECTUS_CLI_DEV && !!process.env.DIRECTUS_CLI_DEV_USE_COMPILED,
};

const entrypoint = path.resolve('./node_modules/@directus/cli/bin/directus.js');
if (__filename !== entrypoint && fs.existsSync(entrypoint) && !startupOptions.useGlobal) {
	require(entrypoint);
	return;
}

async function main(run) {
	const debug = require('debug')('directus-cli');
	try {
		const { error, output } = await run(process.argv);
		if (error) {
			debug(error);
		}

		if (output) {
			await output.flush(process.stdout);
			process.stdout.write('\n');
		}

		process.exit(error ? 1 : 0);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error(error);
		process.exit(1);
	}
}

let run = () => {};

if (!startupOptions.devMode || startupOptions.useCompiled) {
	run = require(`${__dirname}/../dist/index`).default;
} else {
	process.env.DEBUG = `${process.env.DEBUG ?? ''}directus-cli`;
	require('ts-node').register({ project: `${__dirname}/../tsconfig.json` });
	run = require(`${__dirname}/../src/index`).default;
}

main(run);
