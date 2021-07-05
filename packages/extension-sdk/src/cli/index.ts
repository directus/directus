import { Command } from 'commander';
import build from './commands/build';

const pkg = require('../../../package.json');

const program = new Command();

program.name('directus-extension').usage('[command] [options]');
program.version(pkg.version, '-v, --version');

program
	.command('build')
	.description('Bundle a Directus extension to a single entrypoint')
	.option('-i, --input <file>', 'change the default entrypoint', 'src/index.js')
	.option('-o, --output <file>', 'change the default output file', 'dist/index.js')
	.action(build);

program.parse(process.argv);
