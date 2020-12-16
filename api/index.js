module.exports = {
	createApp: require('./dist/app').default,
	...require('./dist/exceptions'),
	...require('./dist/services'),
};
