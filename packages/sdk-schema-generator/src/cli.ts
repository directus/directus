import { Command, Option } from 'commander';
import { fetchDataModel } from './api.js';
import { buildSchema } from './generator.js';
import type { CliOptions } from './types.js';
import { renderSchemaTypes } from './render.js';

async function generateSchema(args: CliOptions) {
	const model = await fetchDataModel(args['host'], args['accessToken']);

	const schema = await buildSchema(model);

	console.log(renderSchemaTypes(schema))
}

const program = new Command();

program.name('directus-sdk-schema').usage('[command] [options]');
program.version('1.0.0' /** read from pkg */);

program
	.command('generate')
	.description('Generate a *.d.ts file')
	.addOption(new Option('-h, --host <host>').makeOptionMandatory(true))
	.addOption(new Option('-t, --access-token <token>').makeOptionMandatory(true))
	.addOption(new Option('-f, --file <file>', 'Write the output to a file'))
	.addOption(new Option('-n, --naming <naming>', 'Select naming strategy')
		.choices(['database', 'camelcase', 'pascalcase', 'snakecase'])
		.default('database'))
	.action(generateSchema);

program.parse(process.argv);
