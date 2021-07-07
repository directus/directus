const axios = require('axios');

module.exports = function registerHook() {
	return {
		'items.create': function () {
			axios.post('http://example.com/webhook');
		},
	};
};
