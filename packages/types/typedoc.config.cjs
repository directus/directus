const fs = require('node:fs');
const path = require('node:path');

function* walkSync(dir) {
	const files = fs.readdirSync(dir, { withFileTypes: true });

	for (const file of files) {
		if (file.isDirectory()) {
			yield* walkSync(path.join(dir, file.name));
		} else {
			yield path.join(dir, file.name);
		}
	}
}

const entryPoints = [];

for (const filePath of walkSync('src')) {
	if (filePath.endsWith('.ts') && !filePath.endsWith('index.ts')) {
		entryPoints.push(filePath);
	}
}

/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
	entryPoints,
	plugin: ['typedoc-plugin-zod'],
	validation: {
		notExported: false,
	},
	readme: 'none',
	navigationLinks: {
		'Directus 🐰': 'https://directus.io',
	},
};
