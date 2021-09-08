#!/usr/bin/env node
const { createCli } = require('./dist/cli/index.js');

createCli()
	.then((program) => program.parseAsync(process.argv))
	.catch((err) => {
		// eslint-disable-next-line no-console
		console.error(err);
		process.exit(1);
	});
