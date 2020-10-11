const appNav = require('./dist/nav-app.json');
const webNav = require('./dist/nav-web.json');
const index = require('./dist/index.json');

module.exports = {
	files: index,
	nav: {
		app: appNav,
		web: webNav,
	},
};
