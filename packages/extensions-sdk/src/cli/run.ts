import { Command } from 'commander';
import create from './commands/create';
import add from './commands/add';
import build from './commands/build';
import link from './commands/link';

const pkg = require('../../../package.json');

const program = new Command();

program.name('directus-extension').usage('[command] [options]');
program.version(pkg.version, '-v, --version');

program
	.command('create')
	.arguments('<type> <name>')
	.description('Scaffold a new Directus extension')
	.option('-l, --language <language>', 'specify the language to use')
	.action(create);

program.command('add').description('Add entries to an existing Directus extension').action(add);

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

program.parse(process.argv);
