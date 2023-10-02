import { Command, Option } from 'commander';
import { fetchDataModel } from './api.js';
import { buildSchema } from './builder.js';
import type { CliOptions } from './types.js';
import { renderSchema } from './render.js';
import { writeFileSync } from 'fs';
import { getPackageVersion } from './version.js';

async function generateSchema(args: CliOptions) {
	const dataModel = await fetchDataModel(args.host, args.accessToken);

	const schemaObject = await buildSchema(dataModel, {
		nameTransform: args.naming,
	});

	const schemaDefinition = renderSchema(schemaObject, {
		rootName: args.rootName,
		indent: { amount: 4, char: ' ' },
	});

	if (args.file) {
		writeFileSync(args.file, schemaDefinition);
	} else {
		/* eslint-disable no-console */
		console.log(schemaDefinition);
	}
}

const program = new Command();

program.name('directus-sdk-schema').usage('[command] [options]');
program.version(getPackageVersion());

program
	.command('generate')
	.description('Generate a *.ts file')
	.addOption(new Option('-h, --host <host>').makeOptionMandatory(true))
	.addOption(new Option('-t, --access-token <token>').makeOptionMandatory(true))
	.addOption(new Option('-f, --file <file>', 'Write the output to a file'))
	.addOption(
		new Option('-n, --naming <naming>', 'Select naming strategy')
			.choices(['database', 'camelcase', 'pascalcase'])
			.default('database')
	)
	.addOption(new Option('--root-name <name>', 'Change the root type name').default('MySchema'))
	.action(generateSchema);

program.parse(process.argv);
