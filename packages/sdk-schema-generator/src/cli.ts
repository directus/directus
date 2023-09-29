import { Command, Option } from 'commander';
import { fetchDataModel } from './api.js';
import { buildSchema } from './builder.js';
import type { CliOptions } from './types.js';
import { renderSchema } from './render.js';
import { writeFileSync } from 'fs';

async function generateSchema(args: CliOptions) {
	const dataModel = await fetchDataModel(args['host'], args['accessToken']);

	const schemaObject = await buildSchema(dataModel, {
		nameTransform: args.naming,
	});

	const schemaDefinition = renderSchema(schemaObject);

	if (args.file) {
		writeFileSync(args.file, schemaDefinition);
	} else {
		/* eslint-disable no-console */
		console.log(schemaDefinition);
	}
}

const program = new Command();

program.name('directus-sdk-schema').usage('[command] [options]');
// TODO read from package.json
program.version('1.0.0');

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
	.action(generateSchema);

program.parse(process.argv);
