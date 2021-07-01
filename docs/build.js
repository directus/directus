const path = require('path/posix');
const fse = require('fs-extra');
const dirTree = require('directory-tree');

// eslint-disable-next-line no-console
console.log('Building docs...');

const tree = dirTree('.', {
	extensions: /\.md$/,
	exclude: /(node_modules|.vuepress|.vscode|dist)/,
	normalizePath: true,
});

const index = `export default ${generateIndex(tree.children)};`;

fse.ensureDirSync('dist');
fse.writeFileSync('dist/index.js', index);

// eslint-disable-next-line no-console
console.log('Built docs');

function generateIndex(tree) {
	const children = tree
		.map((child) => {
			if (child.type === 'file') {
				const baseName = path.basename(child.name, child.extension);
				const basePath = path.join(path.dirname(child.path), path.basename(child.path, child.extension));

				return `{name:'${baseName}',path:'${basePath}',import:()=>import('../${child.path}?raw')}`;
			} else if (child.type === 'directory') {
				const children = generateIndex(child.children);

				if (children === '[]') return null;
				return `{name:'${child.name}',path:'${child.path}',children:${children}}`;
			} else {
				return null;
			}
		})
		.filter((child) => child !== null);

	return `[${children.join(',')}]`;
}
