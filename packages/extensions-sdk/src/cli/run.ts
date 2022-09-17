import { Command } from 'commander';
import create from './commands/create';
import build from './commands/build';

const pkg = require('../../../package.json');

const program = new Command();

program.name('directus-extension').usage('[command] [options]');
program.version(pkg.version, '-v, --version');

program
	.command('create')
	.arguments('<type> <name>')
	.description('Scaffold a new Directus extension')
	.option('-l, --language <language>', 'specify the language to use', 'javascript')
	.action(create);

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

program.parse(process.argv);
