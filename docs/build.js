const dirTree = require('directory-tree');
const fse = require('fs-extra');

console.log('Building docs...');
const tree = dirTree('.', {
	extensions: /\.md$/,
	exclude: /(node_modules|.vuepress|.vscode|dist)/,
	normalizePath: true,
});
fse.writeJSONSync('index.json', tree);
console.log('Built docs');
