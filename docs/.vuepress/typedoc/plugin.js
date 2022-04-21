/**
 * based on: https://github.com/tgreyuk/typedoc-plugin-markdown/tree/master/packages/vuepress-plugin-typedoc
 */
const fs = require('fs');
const { Application, TypeDocReader, TSConfigReader } = require('typedoc');
const { load } = require('typedoc-plugin-markdown');
const { DEFAULT_PLUGIN_OPTIONS, asyncRenderer, renderMardownList, removeDir } = require('./utils');

function generateIndexes(options) {
	const path = options.out + '/classes';
	if (!fs.existsSync(path)) return {};
	const files = fs.readdirSync(path);
	let services = {},
		exceptions = {};
	// create relevant path map
	files.forEach(function (filename) {
		const className = filename.replace('.md', '');
		if (className.includes('Service')) {
			services[className] = '/generated/classes/' + className;
		}
		if (className.includes('Exception')) {
			exceptions[className] = '/generated/classes/' + className;
		}
	});
	// remove unused index files
	fs.unlinkSync(options.out + '/modules.md');
	fs.unlinkSync(options.out + '/README.md');
	// write index files
	fs.writeFileSync(options.out + '/services.md', renderMardownList('Services', services));
	fs.writeFileSync(options.out + '/exceptions.md', renderMardownList('Exceptions', exceptions));
}

module.exports = function (opts, ctx) {
	const options = { ...DEFAULT_PLUGIN_OPTIONS, ...opts };
	const outputDirectory = (ctx.sourceDir || ctx.dir.source()) + '/' + options.out;
	removeDir(outputDirectory);

	let app = new Application();
	load(app);
	app.options.addReader(new TypeDocReader());
	app.options.addReader(new TSConfigReader());
	app.renderer.render = asyncRenderer;
	app.bootstrap(options);

	// if project is undefined typedoc has a problem - error logging will be supplied by typedoc.
	const project = app.convert();
	if (!project) return;

	if (options.watch) {
		app.convertAndWatch((_project) => {
			app.generateDocs(_project, outputDirectory).then(() => {
				generateIndexes(options);
			});
		});
	} else {
		app.generateDocs(project, outputDirectory).then(() => {
			generateIndexes(options);
		});
	}

	return { name: 'vuepress-plugin-typedoc-directus' };
};
