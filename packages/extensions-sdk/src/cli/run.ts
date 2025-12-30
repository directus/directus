import add from './commands/add.js';
import build from './commands/build.js';
import create from './commands/create.js';
import link from './commands/link.js';
import validate from './commands/validate.js';
import getSdkVersion from './utils/get-sdk-version.js';
import { Command } from 'commander';

const program = new Command();

program.name('directus-extension').usage('[command] [options]');
program.version(getSdkVersion(), '-v, --version');

program
	.command('create')
	.arguments('<type> <name>')
	.description('Scaffold a new Directus extension')
	.option('--no-install', 'skip dependency installation after creating extension')
	.option('-l, --language <language>', 'specify the language to use')
	.action(create);

program
	.command('add')
	.description('Add entries to an existing Directus extension')
	.option('--no-install', 'skip dependency (re)installation after adding extension')
	.action(add);

program
	.command('build')
	.description('Bundle a Directus extension to a single entrypoint')
	.option('-t, --type <type>', 'specify the extension type instead of reading from package manifest')
	.option('-i, --input <file>', 'specify the entrypoint instead of reading from package manifest')
	.option('-o, --output <file>', 'specify the output file instead of reading from package manifest')
	.option('-l, --language <language>', '[DEPRECATED]')
	.option('-f, --force', '[DEPRECATED]')
	.option('-w, --watch', 'watch and rebuild on changes')
	.option('--no-minify', 'disable minification')
	.option('--sourcemap', 'include source maps in output')
	.action(build);

program
	.command('link')
	.description('Creates a symlink to the extension in the Directus extensions folder')
	.argument('<path>', 'path to the extension folder of directus')
	.action(link);

program
	.command('validate')
	.description('Validate the extension against the Directus extensions requirements')
	.option('-c, --check <check>', 'check a specific extension requirement')
	.option('-v --verbose', 'print the full validation report')
	.action(validate);

program.parse(process.argv);
