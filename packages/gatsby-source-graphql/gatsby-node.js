const invariant = require(`invariant`);
const Directus = require('@directus/sdk-js');
const { sourceNodes } = require('@lnfusion/gatsby-source-graphql');

function normalizeEndpoint(endpoint, query = {}) {
	const url = new URL(endpoint);
	if (!url.pathname.endsWith('/')) {
		url.pathname = `${url.pathname}/`;
	}

	Object.entries(query)
		.filter(([_, value]) => value !== undefined)
		.forEach(([key, value]) => url.searchParams.set(key, value));

	try {
		const prefix = url.pathname == '/' ? '' : '.';
		const temp = new URL(`${prefix}/graphql`, url.toString());
		temp.hash = url.hash;
		temp.search = url.search;
		return temp.toString();
	} catch (err) {
		return null;
	}
}

exports.sourceNodes = async (gatsby, options) => {
	const { url, graphql, auth = {}, type = {}, ...opts } = options;

	invariant(url && url.length > 0, `\`gatsby-source-directus\` requires option \`url\` to be specified`);

	invariant(type && url.length > 0, `\`gatsby-source-directus\` requires option \`url\` to be specified`);

	let endpoint = normalizeEndpoint(url, {
		access_token: auth.token,
	});

	invariant(endpoint !== null, `\`gatsby-source-directus\` requires a valid \`url\` to be specified`);

	return await sourceNodes(gatsby, {
		...opts,
		url: `${endpoint}`,
		typeName: type.name || 'DirectusData',
		fieldName: type.field || 'directus',
		moduleName: 'gatsby-source-directus',
		moduleSource: 'DirectusSource',
	});
};
