const { RendererEvent } = require('typedoc');
const fs = require('fs');

const DEFAULT_PLUGIN_OPTIONS = {
	entryPoints: ['../index.ts'],
	tsconfig: '../tsconfig.json',
	plugin: ['none'],
	watch: false,
	hideBreadcrumbs: true,
};

async function asyncRenderer(project, outputDirectory) {
	if (!this.prepareTheme()) return;
	const output = new RendererEvent(RendererEvent.BEGIN, outputDirectory, project);
	output.urls = this.theme.getUrls(project);
	this.trigger(output);
	if (!output.isDefaultPrevented) {
		(output.urls || []).forEach((mapping) => {
			this.renderDocument(output.createPageEvent(mapping));
		});
		this.trigger(RendererEvent.END, output);
	}
}

function renderMardownList(title, classes) {
	const list = Object.keys(classes).map((cls) => {
		return `- [${cls}](${classes[cls]})`;
	});
	return `# ${title}\n\n${list.join('\n')}\n\n`;
}

function removeDir(path) {
	if (!fs.existsSync(path)) return;
	const files = fs.readdirSync(path);
	if (files.length > 0) {
		files.forEach(function (filename) {
			if (fs.statSync(path + '/' + filename).isDirectory()) {
				removeDir(path + '/' + filename);
			} else {
				fs.unlinkSync(path + '/' + filename);
			}
		});
	}
	fs.rmdirSync(path);
}

module.exports = {
	DEFAULT_PLUGIN_OPTIONS,
	asyncRenderer,
	renderMardownList,
	removeDir,
};
