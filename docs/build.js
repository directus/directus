const path = require('path');
const fse = require('fs-extra');
const dirTree = require('directory-tree');

console.log('Building docs...');

const tree = dirTree('.', {
	extensions: /\.md$/,
	exclude: /(node_modules|.vuepress|.vscode|dist)/,
	normalizePath: true,
});

const index = `export default ${generateIndex(tree.children)};`;

fse.ensureDirSync('dist');
fse.writeFileSync('dist/index.js', index);

console.log('Built docs');

function formatPath(path) {
	if (!path) return path;
	return path.replace('\\', '\\\\');
}

function generateIndex(tree) {
	const children = tree
		.map((child) => {
			if (child.type === 'file') {
				const baseName = path.basename(child.name, child.extension);
				const basePath = path.join(path.dirname(child.path), path.basename(child.path, child.extension));

				return `{name:'${baseName}',path:'${formatPath(basePath)}',import:()=>import('../${child.path}?raw')}`;
			} else if (child.type === 'directory') {
				const children = generateIndex(child.children);

				if (children === '[]') return null;
				return `{name:'${child.name}',path:'${formatPath(child.path)}',children:${children}}`;
			} else {
				return null;
			}
		})
		.filter((child) => child !== null);

	return `[${children.join(',')}]`;
}
